/**
 * @fileoverview Chat API route for handling AI-powered chatbot interactions.
 * Processes user messages through an AI chatbot that can list/retrieve portfolio
 * data (projects, articles) and perform intelligent searches, streaming responses
 * back to the client in real-time.
 */

import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { buildDynamicContext } from '@/lib/ai/context-builder';
import Analytics from '@/models/Analytics';
import ChatLog from '@/models/ChatLog';
import { executeChatbotGraph } from '@/lib/chatbot-graph';
import {
  tools,
  executeToolCall,
  getToolStatusMessage,
  pruneContext,
  calculateContextSize,
} from '@/lib/chatbot-utils';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
});

// =================================================================================
// MAIN API ROUTE (POST HANDLER)
// =================================================================================

export async function POST(request) {
  const startTime = Date.now();
  try {
    const {
      userMessage,
      chatHistory = [],
      sessionId,
      path = '/',
      useGraph = false,
    } = await request.json();

    if (!userMessage) {
      return NextResponse.json({ error: 'User message is required' }, { status: 400 });
    }

    // Use graph-based implementation if requested
    if (useGraph) {
      const stream = await executeChatbotGraph({ userMessage, chatHistory, path, sessionId });
      return new NextResponse(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
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
          modelName: process.env.OPENAI_MODEL_NAME || 'gpt-3.5-turbo',
        },
      };
    }

    if (context.chatbotSettings?.isActive === false) {
      return NextResponse.json({ error: 'Chatbot is currently disabled' }, { status: 503 });
    }

    const actualModel =
      context.chatbotSettings?.modelName || process.env.OPENAI_MODEL_NAME || 'gpt-3.5-turbo';

    const systemMessages = buildSystemMessages(context, path);
    const messages = [
      ...systemMessages,
      ...chatHistory.map((msg) => ({ role: msg.role, content: msg.content })),
      { role: 'user', content: userMessage },
    ];

    // Iterative tool calling
    const MAX_ITERATIONS = 3;
    const MAX_CONTEXT_CHARS = 50000;
    let toolsUsed = [];
    let iteration = 0;
    let shouldContinue = true;

    while (shouldContinue && iteration < MAX_ITERATIONS) {
      iteration++;

      const prunedMessages = pruneContext(messages, MAX_CONTEXT_CHARS);
      const completion = await openai.chat.completions.create({
        model: actualModel,
        messages: prunedMessages,
        tools,
        tool_choice: 'auto',
      });

      const response = completion.choices[0].message;

      if (response.tool_calls) {
        messages.push(response);

        for (const toolCall of response.tool_calls) {
          const toolResult = await executeToolCall(toolCall);
          const resultString = JSON.stringify(toolResult);

          // Truncate oversized tool results before storing
          const MAX_TOOL_RESULT_SIZE = 5000;
          const isTruncated = resultString.length > MAX_TOOL_RESULT_SIZE;
          const truncatedResult = isTruncated
            ? {
                ...toolResult,
                _truncated: true,
                _originalSize: resultString.length,
                _preview: resultString.substring(0, 1000) + '...',
              }
            : toolResult;

          toolsUsed.push({
            name: toolCall.function.name,
            arguments: JSON.parse(toolCall.function.arguments),
            iteration,
            result: truncatedResult,
          });

          messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(toolResult),
          });
        }
      } else {
        shouldContinue = false;
      }
    }

    // Final prune before streaming
    const finalMessages = pruneContext(messages, MAX_CONTEXT_CHARS);

    const stream = new ReadableStream({
      async start(controller) {
        let assistantMessage = { content: '' };
        try {
          // Send tool status updates before streaming content
          for (const tool of toolsUsed) {
            const statusMessage = getToolStatusMessage(tool.name, tool.arguments, tool.iteration);
            controller.enqueue(
              new TextEncoder().encode(
                JSON.stringify({ type: 'status', message: statusMessage }) + '\n'
              )
            );
          }

          const completion = await openai.chat.completions.create({
            model: actualModel,
            messages: finalMessages,
            stream: true,
          });

          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              assistantMessage.content += content;
              controller.enqueue(
                new TextEncoder().encode(
                  JSON.stringify({ type: 'content', message: content }) + '\n'
                )
              );
            }
          }

          controller.close();

          // Skip analytics + log if there was no response
          if (!assistantMessage.content?.trim()) return;

          // Save analytics event (fire-and-forget, don't block stream)
          const analyticsEvent = new Analytics({
            eventType: 'chatbot_interaction',
            path,
            sessionId,
            properties: {
              userQuestion: userMessage,
              toolsCount: toolsUsed.length,
              toolsUsed: toolsUsed.length ? toolsUsed : undefined,
            },
          });
          analyticsEvent.save().catch((err) => console.error('[Chat] Analytics save failed:', err));

          // Build conversation context for the log
          const currentConversationTurn = [
            ...systemMessages,
            ...chatHistory.filter((msg) => msg.role !== 'assistant'),
            { role: 'user', content: userMessage },
          ];

          const contextString = JSON.stringify(currentConversationTurn);
          const MAX_CONTEXT_SIZE = 50000;
          const shouldTruncateContext = contextString.length > MAX_CONTEXT_SIZE;
          const finalContextForDB = shouldTruncateContext
            ? [
                {
                  role: 'system',
                  content: `Context truncated for storage. Original: ${contextString.length} chars, ${currentConversationTurn.length} messages.`,
                },
                ...currentConversationTurn.filter((m) => m.role === 'system'),
              ]
            : currentConversationTurn;

          const chatLog = new ChatLog({
            sessionId,
            path,
            userMessage,
            aiResponse: assistantMessage.content,
            modelName: actualModel,
            conversationContext: finalContextForDB,
            toolsUsed,
            executionTime: Date.now() - startTime,
          });

          chatLog.save().catch((err) => console.error('[Chat] ChatLog save failed:', err));
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
