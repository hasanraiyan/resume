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

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
});

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
    const { userMessage, chatHistory = [], sessionId, path = '/' } = await request.json();

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

    const actualModel =
      context.chatbotSettings?.modelName || process.env.OPENAI_MODEL_NAME || 'openai-large';

    const systemMessages = buildSystemMessages(context, path);

    // Build message history — passed into the stream closure
    const messages = [
      ...systemMessages,
      ...chatHistory.map((msg) => ({ role: msg.role, content: msg.content })),
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

        try {
          for (let iteration = 1; iteration <= MAX_ITERATIONS; iteration++) {
            const prunedMessages = pruneContext(messages, MAX_CONTEXT_CHARS);

            // ── Open a streaming completion ──────────────────────────────────
            const completionStream = await openai.chat.completions.create({
              model: actualModel,
              messages: prunedMessages,
              tools,
              tool_choice: 'auto',
              stream: true,
            });

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

            // Push the assistant turn (with tool_calls) into the message history
            messages.push({
              role: 'assistant',
              content: iterationContent || null,
              tool_calls: assembledToolCalls,
            });

            // ── Execute every tool call and emit status events live ──────────
            for (const toolCall of assembledToolCalls) {
              let parsedArgs;
              try {
                parsedArgs = JSON.parse(toolCall.function.arguments);
              } catch {
                parsedArgs = {};
              }

              // Emit status so the user sees "🔍 Getting project details..." instantly
              const statusMsg = getToolStatusMessage(toolCall.function.name, parsedArgs, iteration);
              controller.enqueue(encodeEvent({ type: 'status', message: statusMsg }));

              // Execute the tool DB query (returns { text, data })
              const toolResult = await executeToolCall(toolCall);

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
            }
            // Loop continues → AI gets the tool results and can call more tools or answer
          }

          controller.close();

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
            modelName: actualModel,
            conversationContext: finalContextForDB,
            toolsUsed,
            executionTime: Date.now() - startTime,
          })
            .save()
            .catch((err) => console.error('[Chat] ChatLog save failed:', err));
        } catch (error) {
          console.error('[Chat] Stream error:', error);
          controller.error(error);
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

TOOL RESPONSE FORMAT:
Tools return human-readable markdown with links. Use the markdown format provided by tools directly in responses.

GOAL: Convert visitors to clients by guiding them to the contact form using: "${settings.callToAction}"
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
