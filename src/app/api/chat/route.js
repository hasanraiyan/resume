/**
 * @fileoverview Chat API route for handling AI-powered chatbot interactions.
 * Uses true end-to-end streaming — the agentic tool-calling loop runs inside
 * the ReadableStream so status events and content tokens are sent to the client
 * in real time with no blocking pre-stream phase.
 */

import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { buildDynamicContext } from '@/lib/ai/context-builder';
import Analytics from '@/models/Analytics';
import ChatLog from '@/models/ChatLog';
import { tools, executeToolCall, getToolStatusMessage, pruneContext } from '@/lib/chatbot-utils';
import { getUIBlockForToolResult } from '@/lib/chatbot-generative-ui';
import { rateLimit } from '@/lib/rateLimit';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { getBackendMCPConfig } from '@/lib/mcpConfig';
import { decrypt } from '@/lib/crypto';

// =================================================================================
// HELPERS
// =================================================================================

/** UTF-8 encodes a JSON event line for the stream. */
function encodeEvent(obj) {
  return new TextEncoder().encode(JSON.stringify(obj) + '\n');
}

/**
 * Merges streaming tool_call deltas into a map keyed by index.
 * Each entry accumulates id, function.name, and function.arguments.
 */
function mergeToolCallDeltas(map, deltas) {
  for (const d of deltas) {
    const idx = d.index ?? 0;
    if (!map[idx]) {
      map[idx] = { id: '', type: 'function', function: { name: '', arguments: '' } };
    }
    if (d.id) map[idx].id += d.id;
    if (d.function?.name) map[idx].function.name += d.function.name;
    if (d.function?.arguments) map[idx].function.arguments += d.function.arguments;
  }
}

// =================================================================================
// MAIN API ROUTE (POST HANDLER)
// =================================================================================

export async function POST(request) {
  const rateLimitResponse = rateLimit(request, 10, 60000); // 10 requests per minute
  if (rateLimitResponse) return rateLimitResponse;

  const startTime = Date.now();

  try {
    const {
      userMessage,
      chatHistory = [],
      sessionId: providedSessionId,
      path = '/',
      activeMCPs = [],
      selectedModel,
    } = await request.json();

    const sessionId =
      providedSessionId || `fallback-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    if (!userMessage) {
      return NextResponse.json({ error: 'User message is required' }, { status: 400 });
    }

    // Build dynamic context (with fallback on failure)
    let context;
    try {
      context = await buildDynamicContext();
    } catch {
      context = {
        chatbotSettings: {
          aiName: 'Kiro',
          persona: 'You are Kiro, a professional and helpful AI assistant representing Raiyan.',
          callToAction: "I'd be happy to help you get in touch with Raiyan.",
          rules: ['Always be professional and helpful'],
          isActive: true,
          modelName: process.env.OPENAI_MODEL_NAME || 'openai-large',
        },
      };
    }

    if (context.chatbotSettings?.isActive === false) {
      return NextResponse.json({ error: 'Chatbot is currently disabled' }, { status: 503 });
    }

    const defaultModel = {
      providerId: 'default-openai',
      model: process.env.OPENAI_MODEL_NAME || 'openai-large',
    };
    const actualModelSelection =
      selectedModel || context.chatbotSettings?.modelName || defaultModel;

    // Ensure actualModelSelection is an object
    const actualModel =
      typeof actualModelSelection === 'string'
        ? { providerId: 'default-openai', model: actualModelSelection }
        : actualModelSelection;

    // Find the provider in the settings
    const providers = context.chatbotSettings?.providers || [];
    let provider = providers.find((p) => p.id === actualModel.providerId);

    // Fallback if provider not found or not in providers array
    if (!provider) {
      provider = {
        id: 'default-openai',
        baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
        apiKey: process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY : 'sk-none', // not encrypted here since fallback
        supportsTools: true,
      };
    } else {
      // Decode if we got it from DB
      provider.apiKey = decrypt(provider.apiKey);
    }

    // Initialize OpenAI client dynamically based on the provider config
    const openai = new OpenAI({
      apiKey: provider.apiKey || process.env.OPENAI_API_KEY,
      baseURL: provider.baseUrl || process.env.OPENAI_BASE_URL,
    });

    const systemMessages = buildSystemMessages(context, path);

    // Build message history — passed into the stream closure
    const messages = [
      ...systemMessages,
      ...chatHistory.map((msg) => {
        const m = { role: msg.role, content: msg.content };
        if (msg.tool_calls) m.tool_calls = msg.tool_calls;
        if (msg.tool_call_id) m.tool_call_id = msg.tool_call_id;
        return m;
      }),
      { role: 'user', content: userMessage },
    ];

    // -------------------------------------------------------------------------
    // True end-to-end streaming
    //
    // The entire agentic loop runs inside the ReadableStream so we can push
    // events to the client immediately:
    //   {type: "status", message: "🔍 Getting project details..."}  ← real time
    //   {type: "content", message: "Sure! Here's what I found…"}   ← tokens live
    // -------------------------------------------------------------------------
    const stream = new ReadableStream({
      async start(controller) {
        const MAX_ITERATIONS = 3;
        const MAX_CONTEXT_CHARS = 50_000;
        const MAX_TOOL_RESULT_SIZE = 5_000;

        const toolsUsed = [];
        let assistantContent = '';
        const mcpClients = [];
        let allTools = [...tools];

        try {
          if (activeMCPs && activeMCPs.length > 0) {
            controller.enqueue(
              encodeEvent({ type: 'status', message: '🔌 Connecting to external tools...' })
            );
            // activeMCPs is now an array of IDs from the frontend
            const backendMCPs = getBackendMCPConfig();

            for (const mcpId of activeMCPs) {
              // Find the backend configuration for this ID
              const mcpConfig = backendMCPs.find((m) => m.id === mcpId);

              try {
                if (!mcpConfig) {
                  console.warn(`Skipping invalid or securely disabled Tool: ${mcpId}`);
                  continue;
                }

                // Handle Native REST tools mapped from the MCP configuration
                if (mcpConfig.type === 'rest') {
                  if (mcpId === 'mcp-tavily' && mcpConfig.apiKey) {
                    allTools.push({
                      type: 'function',
                      function: {
                        name: 'search_the_internet',
                        description:
                          'CRITICAL: Use this tool to search the live internet for up-to-date information, latest news, current events, and facts outside your training data. Extremely useful when the user asks for "news", "latest", or "search".',
                        parameters: {
                          type: 'object',
                          properties: {
                            query: {
                              type: 'string',
                              description:
                                'The search query to look up on the web. Make it concise and optimized for a search engine.',
                            },
                          },
                          required: ['query'],
                        },
                      },
                      _isREST: true,
                      _restProvider: 'tavily',
                      _apiKey: mcpConfig.apiKey,
                    });
                  }
                  continue;
                }

                // Standard SSE MCPs must have a url
                if (!mcpConfig.url) continue;

                const transport = new SSEClientTransport(new URL(mcpConfig.url));
                const client = new Client(
                  { name: 'KiroChatbot', version: '1.0.0' },
                  { capabilities: { tools: {} } }
                );

                // Enforce a strict 5-second timeout on the MCP connection to prevent hanging
                const connectPromise = client.connect(transport);
                const timeoutPromise = new Promise((_, reject) =>
                  setTimeout(() => reject(new Error('Connection timed out after 5000ms')), 5000)
                );

                await Promise.race([connectPromise, timeoutPromise]);

                mcpClients.push({ url: mcpConfig.url, client, transport });

                const { tools: extTools } = await client.listTools();
                if (extTools) {
                  for (const extTool of extTools) {
                    allTools.push({
                      type: 'function',
                      function: {
                        name: `mcp_${mcpClients.length - 1}_${extTool.name}`,
                        description: extTool.description,
                        parameters: extTool.inputSchema,
                      },
                      _isMCP: true,
                      _originalName: extTool.name,
                      _clientIndex: mcpClients.length - 1,
                    });
                  }
                }
              } catch (err) {
                console.error('[Chat] Failed to connect to MCP:', mcpConfig.url, err);
              }
            }
          }

          const toolsForOpenAI = allTools.map((t) => ({ type: t.type, function: t.function }));

          for (let iteration = 1; iteration <= MAX_ITERATIONS; iteration++) {
            const prunedMessages = pruneContext(messages, MAX_CONTEXT_CHARS);

            // ── Open a streaming completion ──────────────────────────────────
            const chatOptions = {
              model: actualModel.model,
              messages: prunedMessages,
              stream: true,
            };

            if (provider.supportsTools !== false && toolsForOpenAI.length > 0) {
              chatOptions.tools = toolsForOpenAI;
              chatOptions.tool_choice = 'auto';
            }

            const completionStream = await openai.chat.completions.create(chatOptions);

            // Accumulate deltas
            const toolCallMap = {}; // index → partial tool call
            let hasToolCalls = false;
            let iterationContent = ''; // assistant text for this iteration

            for await (const chunk of completionStream) {
              const delta = chunk.choices[0]?.delta;
              if (!delta) continue;

              if (delta.tool_calls?.length) {
                hasToolCalls = true;
                mergeToolCallDeltas(toolCallMap, delta.tool_calls);
              }

              if (delta.content) {
                iterationContent += delta.content;
                assistantContent += delta.content;
                // Stream content tokens to the client immediately
                controller.enqueue(encodeEvent({ type: 'content', message: delta.content }));
              }
            }

            // ── If no tool calls, AI gave its final answer — we're done ─────
            if (!hasToolCalls) break;

            // ── Assemble resolved tool calls from the delta map ──────────────
            const assembledToolCalls = Object.values(toolCallMap);
            console.log(
              `\n\n[Chat Iteration ${iteration}] AI Selected Tools:`,
              assembledToolCalls.map((t) => t.function.name)
            );

            // Push the assistant turn (with tool_calls) into the message history
            messages.push({
              role: 'assistant',
              content: iterationContent || null,
              tool_calls: assembledToolCalls,
            });

            // Stream metadata to the client so it can preserve tool_calls in history
            controller.enqueue(
              encodeEvent({
                type: 'metadata',
                tool_calls: assembledToolCalls,
              })
            );

            // ── Execute every tool call and emit status events live ──────────
            for (const toolCall of assembledToolCalls) {
              let parsedArgs;
              try {
                parsedArgs = JSON.parse(toolCall.function.arguments);
              } catch {
                parsedArgs = {};
              }

              // Emit status so the user sees "🔍 Getting project details..." instantly
              let statusMsg = getToolStatusMessage(toolCall.function.name, parsedArgs, iteration);

              // Handle MCP tools execution
              let toolResult;
              const mcpMatch = allTools.find((t) => t.function.name === toolCall.function.name);

              if (mcpMatch && mcpMatch._isMCP) {
                if (!statusMsg || statusMsg.includes('Processing your request')) {
                  statusMsg = `⚙️ Running ${mcpMatch._originalName}...${iteration > 1 ? ` (step ${iteration})` : ''}`;
                }
                controller.enqueue(encodeEvent({ type: 'status', message: statusMsg }));
                try {
                  const mcpClientInfo = mcpClients[mcpMatch._clientIndex];
                  const res = await mcpClientInfo.client.callTool({
                    name: mcpMatch._originalName,
                    arguments: parsedArgs,
                  });
                  toolResult = {
                    text: res.content.map((c) => c.text).join('\n'),
                  };
                } catch (err) {
                  toolResult = { error: err.message };
                }
              } else if (mcpMatch && mcpMatch._isREST) {
                // Execute Native REST Tool
                if (!statusMsg || statusMsg.includes('Processing your request')) {
                  statusMsg = `🌐 Searching the web...${iteration > 1 ? ` (step ${iteration})` : ''}`;
                }
                controller.enqueue(encodeEvent({ type: 'status', message: statusMsg }));
                try {
                  if (mcpMatch._restProvider === 'tavily') {
                    const tResponse = await fetch('https://api.tavily.com/search', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        api_key: mcpMatch._apiKey,
                        query: parsedArgs.query,
                        search_depth: 'basic',
                        include_answer: true,
                      }),
                    });
                    if (!tResponse.ok) throw new Error(`Tavily API error: ${tResponse.status}`);
                    const tData = await tResponse.json();
                    toolResult = {
                      text:
                        tData.answer ||
                        (tData.results && tData.results.map((r) => r.content).join('\\n\\n')) ||
                        'No results found.',
                    };
                  }
                } catch (err) {
                  toolResult = { error: err.message };
                }
              } else {
                controller.enqueue(encodeEvent({ type: 'status', message: statusMsg }));
                // Execute the internal tool DB query
                toolResult = await executeToolCall(toolCall);
              }

              // 1. Check if we should emit a Generative UI block to the frontend
              const uiBlock = getUIBlockForToolResult(toolCall.function.name, toolResult);
              if (uiBlock) {
                controller.enqueue(encodeEvent({ type: 'ui', ...uiBlock }));
              }

              // 2. Extract just the markdown text for the LLM to read
              // If the tool failed or is returning an old format, fallback to standard stringification
              const stringResultForLLM =
                typeof toolResult === 'string'
                  ? toolResult
                  : toolResult.text || JSON.stringify(toolResult);

              // Truncate oversized tool results before storing in history
              const isTruncated = stringResultForLLM.length > MAX_TOOL_RESULT_SIZE;
              const storedResult = isTruncated
                ? {
                    _truncated: true,
                    _originalSize: stringResultForLLM.length,
                    _preview: stringResultForLLM.substring(0, 1_000) + '...',
                  }
                : stringResultForLLM;

              toolsUsed.push({
                name: toolCall.function.name,
                arguments: parsedArgs,
                iteration,
                result: storedResult,
              });

              // Push the tool result TEXT back into the message history for the LLM
              messages.push({
                role: 'tool',
                tool_call_id: toolCall.id,
                content: stringResultForLLM,
              });

              // Stream tool result back to the client for history preservation
              controller.enqueue(
                encodeEvent({
                  type: 'tool_result',
                  tool_call_id: toolCall.id,
                  content: stringResultForLLM,
                })
              );

              // If the tool called was "draftContactLead", force the loop to stop after this iteration.
              // This gives the user time to review the UI block before any further AI actions.
              if (toolCall.function.name === 'draftContactLead') {
                iteration = MAX_ITERATIONS + 1; // Break outer loop
              }
            }
            // Loop continues → AI gets the tool results and can call more tools or answer
          }

          controller.close();

          for (const { transport } of mcpClients) {
            try {
              await transport.close();
            } catch (e) {
              console.error('[Chat] Error closing MCP transport:', e);
            }
          }

          // ── Post-stream analytics & logging (fire-and-forget) ────────────
          if (!assistantContent?.trim()) return;

          new Analytics({
            eventType: 'chatbot_interaction',
            path,
            sessionId,
            properties: {
              userQuestion: userMessage,
              toolsCount: toolsUsed.length,
              toolsUsed: toolsUsed.length ? toolsUsed : undefined,
            },
          })
            .save()
            .catch((err) => console.error('[Chat] Analytics save failed:', err));

          const currentConversationTurn = [
            ...systemMessages,
            ...chatHistory.filter((msg) => msg.role !== 'assistant'),
            { role: 'user', content: userMessage },
          ];

          const contextString = JSON.stringify(currentConversationTurn);
          const shouldTruncateContext = contextString.length > 50_000;
          const finalContextForDB = shouldTruncateContext
            ? [
                {
                  role: 'system',
                  content: `Context truncated. Original: ${contextString.length} chars, ${currentConversationTurn.length} messages.`,
                },
                ...currentConversationTurn.filter((m) => m.role === 'system'),
              ]
            : currentConversationTurn;

          new ChatLog({
            sessionId,
            path,
            userMessage,
            aiResponse: assistantContent,
            modelName: actualModel.model,
            conversationContext: finalContextForDB,
            toolsUsed,
            executionTime: Date.now() - startTime,
          })
            .save()
            .catch((err) => console.error('[Chat] ChatLog save failed:', err));
        } catch (error) {
          console.error('[Chat] Stream error:', error);
          controller.error(error);

          // Ensure clients are closed on error
          for (const { transport } of mcpClients) {
            try {
              await transport.close();
            } catch (e) {}
          }
        }
      },
    });

    return new NextResponse(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  } catch (error) {
    console.error('[Chat] Fatal error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// =================================================================================
// SYSTEM MESSAGES
// =================================================================================

/**
 * Builds system messages that define the AI's behavior and capabilities.
 */
export function buildSystemMessages(context, path) {
  const { chatbotSettings } = context || {};

  const defaultSettings = {
    aiName: 'Kiro',
    persona: 'You are Kiro, a professional and helpful AI assistant representing Raiyan.',
    callToAction: "I'd be happy to help you get in touch with Raiyan.",
    rules: [
      'Always be professional and helpful',
      'Guide users toward the contact form when appropriate',
    ],
  };

  const settings = chatbotSettings || defaultSettings;

  return [
    {
      role: 'system',
      content: `You are ${settings.aiName}. ${settings.persona}. Your knowledge of projects and articles is limited; you must use tools to get information.

CRITICAL INSTRUCTIONS:
1. Do not make up information. If you don't know, use a tool.
2. Always be professional, confident, and exceptionally helpful.
3. You represent Raiyan's professional portfolio and speak on behalf of Raiyan's portfolio.
4. Your primary goal is to understand visitor needs and demonstrate how Raiyan's skills are the perfect solution.

LINK FORMATTING RULES (CRITICAL):
- ALWAYS include reference links when discussing projects or articles
- Projects: Use format [Project Title](https://hasanraiyan.vercel.app/projects/slug)
- Articles: Use format [Article Title](https://hasanraiyan.vercel.app/blog/slug)
- Live demos: Use [View Live Demo](external-url) 🔗
- GitHub: Use [GitHub Repository](external-url) 💻
- NEVER mention projects/articles without including clickable links

CONTACT FORM INSTRUCTIONS (CRITICAL):
When a user expresses interest in starting a project, hiring Raiyan, or contacting him, DO NOT immediately use the \`draftContactLead\` tool.
Instead, follow this process:
1. Enthusiastically acknowledge their interest.
2. Ask them for the required information: their name, their email address, and a brief description of what they are looking to build (if they haven't provided it already).
3. Wait for their response.
4. ONLY ONCE you have collected at least their name, email, and a basic message/idea, THEN call the \`draftContactLead\` tool to present them with the draft.
5. After calling \`draftContactLead\`, tell them they can review the details in the card above and click "Send" to deliver the message.

TOOL RESPONSE FORMAT:
Tools return human-readable markdown with links. Use the markdown format provided by tools directly in responses.

STANDALONE CONTACT FLOW:
- Your only contact tool is \`draftContactLead\`. It creates a UI card for the user.
- The user will see this UI card and click "Send" themselves. YOU DO NOT handle the actual submission.
- NEVER tell the user that you are "sending" or "submitting" the message; instead, say you have "prepared a draft" or "prefilled the form".
- Users can submit from any page; you don't need to redirect them to the contact section.

GOAL: Convert visitors to clients by using the standalone contact flow: "${settings.callToAction}"
RULES: ${settings.rules?.join('. ') || defaultSettings.rules.join('. ')}

PAGE CONTEXT: The user is currently on this page: "${path || '/'}"

BEHAVIOR:
- Identify visitor needs and connect to Raiyan's services/projects
- Never give definitive prices - redirect to contact for quotes
- Use page context in responses (start with "On this project..." or "In this article...")
- Be proactive: ask follow-up questions and guide to next steps
- After 2-3 exchanges, pivot towards the call-to-action for potential projects
- Handle "Who are you?" questions professionally
- Maintain scope: only answer Raiyan/portfolio/technology questions
- Be concise: 2-4 sentences per response
- Use 'Raiyan' when referring to the developer, 'we' for work/capabilities`,
    },
  ];
}
