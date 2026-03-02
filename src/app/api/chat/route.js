/**
 * @fileoverview Chat API route for handling AI-powered chatbot interactions.
 * Uses LangGraph and @langchain/core to provide robust agent loops,
 * built-in MultiServerMCPClient for external tools, and true end-to-end streaming.
 */

import { NextResponse } from 'next/server';
import { buildDynamicContext } from '@/lib/ai/context-builder';
import Analytics from '@/models/Analytics';
import ChatLog from '@/models/ChatLog';
import { internalTools, getToolStatusMessage } from '@/lib/chatbot-utils';
import { getUIBlockForToolResult } from '@/lib/chatbot-generative-ui';
import { rateLimit } from '@/lib/rateLimit';
import { getBackendMCPConfig } from '@/lib/mcpConfig';
import { decrypt } from '@/lib/crypto';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { z } from 'zod';
import { ChatOpenAI } from '@langchain/openai';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { tool } from '@langchain/core/tools';
import { MultiServerMCPClient } from '@langchain/mcp-adapters';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import {
  trimMessages,
  AIMessage,
  HumanMessage,
  SystemMessage,
  ToolMessage,
} from '@langchain/core/messages';

// =================================================================================
// LOGIC AND HELPERS
// =================================================================================

function encodeEvent(obj) {
  return new TextEncoder().encode(JSON.stringify(obj) + '\n');
}

// Convert DB provider to a LangChain Chat Model
function resolveLangChainModel(actualModel, provider) {
  const modelName = (actualModel.model || '').replace(/^models\//, '');
  const isGoogle = provider.baseUrl?.includes('googleapis');

  if (isGoogle) {
    return new ChatGoogleGenerativeAI({
      model: modelName,
      apiKey: provider.apiKey,
    });
  }

  return new ChatOpenAI({
    modelName,
    openAIApiKey: provider.apiKey,
    configuration: { baseURL: provider.baseUrl },
  });
}

// =================================================================================
// MAIN API ROUTE (POST HANDLER)
// =================================================================================

export async function POST(request) {
  const rateLimitResponse = rateLimit(request, 10, 60000);
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

    if (!userMessage)
      return NextResponse.json({ error: 'User message is required' }, { status: 400 });

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
          modelName: { providerId: '', model: '' },
        },
      };
    }

    if (context.chatbotSettings?.isActive === false) {
      return NextResponse.json({ error: 'Chatbot is currently disabled' }, { status: 503 });
    }

    const actualModelSelection = selectedModel ||
      context.chatbotSettings?.fastModel || { providerId: '', model: '' };
    const actualModel =
      typeof actualModelSelection === 'string'
        ? { providerId: '', model: actualModelSelection }
        : actualModelSelection;
    const providers = context.chatbotSettings?.providers || [];
    let provider = providers.find((p) => p.id === actualModel.providerId);

    if (!provider || !actualModel.model) {
      return NextResponse.json({ error: 'AI Chatbot is not fully configured.' }, { status: 500 });
    }

    provider.apiKey = decrypt(provider.apiKey);
    const llm = resolveLangChainModel(actualModel, provider);
    const systemMessages = buildSystemMessages(context, path);

    // Initial LangChain state
    const messages = [
      ...systemMessages.map((msg) => new SystemMessage({ content: msg.content || '' })),
      ...chatHistory.map((msg) => {
        if (msg.role === 'user') return new HumanMessage({ content: msg.content || '' });
        if (msg.role === 'assistant') {
          const params = { content: msg.content || '' };
          if (msg.tool_calls && Array.isArray(msg.tool_calls)) {
            params.tool_calls = msg.tool_calls.map((tc) => {
              let parsedArgs = {};
              try {
                parsedArgs =
                  typeof tc.function.arguments === 'string'
                    ? JSON.parse(tc.function.arguments)
                    : tc.function.arguments;
              } catch (e) {}
              return {
                id: tc.id || `unknown-id-${Math.random()}`,
                name: tc.function.name || 'unknown_function',
                args: parsedArgs,
              };
            });
          }
          return new AIMessage(params);
        }
        if (msg.role === 'tool') {
          return new ToolMessage({
            content:
              typeof msg.content === 'string'
                ? msg.content
                : JSON.stringify(msg.content) || 'No content',
            name: msg.name || 'unknown',
            tool_call_id: msg.tool_call_id || 'unknown-id',
          });
        }
        return new SystemMessage({ content: msg.content || '' });
      }),
      new HumanMessage({ content: userMessage }),
    ];

    const stream = new ReadableStream({
      async start(controller) {
        let toolsUsed = [];
        let assistantContent = '';
        let allTools = [...internalTools];
        let mcpClient = null;

        try {
          if (activeMCPs?.length > 0) {
            controller.enqueue(
              encodeEvent({ type: 'status', message: '🔌 Connecting to external tools...' })
            );
            const session = await getServerSession(authOptions);
            const isAdmin = session?.user?.role === 'admin';
            const backendMCPs = await getBackendMCPConfig(isAdmin);

            // 1. Resolve MultiServerMCPClient tools (SSE/HTTP transports)
            const mcpServerConfig = {};
            for (const mcpId of activeMCPs) {
              const cfg = backendMCPs.find((m) => m.id === mcpId);
              if (cfg && cfg.type !== 'rest' && cfg.url) {
                mcpServerConfig[mcpId] = {
                  transport: 'sse',
                  url: cfg.url,
                };
              }
            }

            if (Object.keys(mcpServerConfig).length > 0) {
              try {
                mcpClient = new MultiServerMCPClient(mcpServerConfig);
                const dynamicMcpTools = await mcpClient.getTools();
                allTools.push(...dynamicMcpTools);
              } catch (e) {
                console.error('[Chat] Failed getting MCP Tools:', e);
              }
            }
          }

          // Build context trimmer to prevent 400 Bad Requests and save tokens
          const trimmer = trimMessages({
            maxTokens: 50000,
            strategy: 'last',
            tokenCounter: (msgs) =>
              msgs.map((m) => (m.content || '').length).reduce((a, b) => a + b, 0),
            includeSystem: true,
            allowPartial: false,
            startOn: 'human', // Strongly recommended by Google to prevent 400 sequence errors
          });

          // Disable tools if provider requires it
          const finalTools = provider.supportsTools !== false ? allTools : [];
          console.log('Final tools sent for AI response:', finalTools);

          // Create the agent Graph
          const agent = createReactAgent({
            llm: llm,
            tools: finalTools,
            messageModifier: trimmer,
          });

          // Run streamed execution
          const eventStream = await agent.streamEvents({ messages }, { version: 'v2' });

          for await (const event of eventStream) {
            const { event: type, data, name } = event;

            if (type === 'on_chat_model_stream') {
              // Real-time text token stream
              if (data.chunk?.content) {
                assistantContent += data.chunk.content;
                controller.enqueue(encodeEvent({ type: 'content', message: data.chunk.content }));
              }
            } else if (type === 'on_tool_start' && name !== 'agent') {
              // Tool started -> send status to frontend UI
              const inputArgs = data.input;
              const statusMsg = getToolStatusMessage(name, inputArgs) || `⚙️ Running ${name}...`;
              controller.enqueue(encodeEvent({ type: 'status', message: statusMsg }));
            } else if (type === 'on_tool_end' && name !== 'agent') {
              // Tool finished execution -> push GenUI or Results
              const output = data.output;

              // Map UI components (e.g. project list rendering visually)
              const uiBlock = getUIBlockForToolResult(name, output);
              if (uiBlock) {
                controller.enqueue(encodeEvent({ type: 'ui', ...uiBlock }));
              }

              // Send result to the frontend history manager
              controller.enqueue(
                encodeEvent({
                  type: 'tool_result',
                  tool_call_id: event.run_id, // Note: For true state sync we approximate run_id -> tool_call_id
                  name: name,
                  content: typeof output === 'string' ? output : JSON.stringify(output),
                })
              );

              toolsUsed.push({ name, arguments: data.input, result: output, iteration: 1 });

              // Important UI hack: if contact form drafts, stop execution
              // In native langgraph, we could raise a custom error or just let the model realize it shouldn't talk anymore,
              // but for now, we leave it to System prompt control ("After draftContactLead tell user to click send").
            } else if (type === 'on_chat_model_end') {
              // When the model provides formal tool_call metadata, pass it down so frontend keeps id consistency
              const aiMessage = data.output;
              if (aiMessage?.tool_calls?.length > 0) {
                // Map Langchain ToolCall back to raw format Frontend expects
                const formattedCalls = aiMessage.tool_calls.map((tc) => ({
                  id: tc.id,
                  type: 'function',
                  function: { name: tc.name, arguments: JSON.stringify(tc.args) },
                }));
                controller.enqueue(encodeEvent({ type: 'metadata', tool_calls: formattedCalls }));
              }
            }
          }

          controller.close();
        } catch (error) {
          console.error('[Chat] Graph stream error:', error);
          controller.error(error);
        } finally {
          // Cleanup dynamically allocated MultiServer client
          // (Current Langchain mcp-adapters handle ephemeral closing mostly, but good practice)
          if (mcpClient) {
            // Future safe-guard if cleanup methods added
          }
        }

        // Post Stream Background Async DB Updates
        if (!assistantContent?.trim()) return;

        new Analytics({
          eventType: 'chatbot_interaction',
          path,
          sessionId,
          properties: { userQuestion: userMessage, toolsCount: toolsUsed.length, toolsUsed },
        })
          .save()
          .catch((e) => console.error(e));

        new ChatLog({
          sessionId,
          path,
          userMessage,
          aiResponse: assistantContent,
          modelName: actualModel.model,
          conversationContext: [{ role: 'system', content: 'Context truncated for logs' }], // Simplification to avoid DB sizing issues
          toolsUsed,
          executionTime: Date.now() - startTime,
        })
          .save()
          .catch((e) => console.error(e));
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

export function buildSystemMessages(context, path) {
  const { chatbotSettings } = context || {};
  const settings = chatbotSettings || {
    aiName: 'Kiro',
    persona: 'You are Kiro, a professional and helpful AI assistant representing Raiyan.',
    callToAction: "I'd be happy to help you get in touch with Raiyan.",
    rules: [
      'Always be professional and helpful',
      'Guide users toward the contact form when appropriate',
    ],
  };

  return [
    {
      role: 'system',
      content: `You are ${settings.aiName}. ${settings.persona}. Your knowledge of projects and articles is limited; you must use tools to get information.

CRITICAL INSTRUCTIONS:
1. Do not make up information. If you don't know, use a tool.
2. Always be professional, confident, and exceptionally helpful.
3. You represent Raiyan's professional portfolio.
4. When you call tools (projects, articles, contact), the system automatically intercepts the data and displays beautiful UI cards to the user below your chat bubble. Therefore, PLEASE explicitly type a friendly introductory/summarizing chat message for the user after the tool data finishes so your response bubble isn't empty!

LINK FORMATTING RULES:
- ALWAYS include reference links when discussing projects/articles ([Title](url))
- Live demos: [View Live Demo](url) 🔗 | GitHub: [GitHub Repository](url) 💻

CONTACT FORM INSTRUCTIONS:
- ONLY ONCE you have collected at least their name, email, and a basic message/idea, THEN call the \`draftContactLead\` tool.
- After calling \`draftContactLead\`, STOP execution and tell them they can review the details in the card and click "Send".

GOAL: Convert visitors to clients by using the call to action: "${settings.callToAction}"
RULES: ${settings.rules?.join('. ') || ''}
PAGE CONTEXT: The user is currently on: "${path || '/'}"`,
    },
  ];
}
