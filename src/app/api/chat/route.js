/**
 * @fileoverview Chat API route for handling AI-powered chatbot interactions.
 * This module provides conversational AI capabilities with function calling
 * to access portfolio data (projects and articles) dynamically.
 *
 * @description This API endpoint processes user messages through an AI chatbot that can:
 * - List and retrieve project details using database queries
 * - List and retrieve article content from the blog
 * - Perform intelligent searches across portfolio content
 * - Maintain conversation context and chat history
 * - Track analytics for chatbot interactions
 * - Stream responses back to the client in real-time
 *
 * The chatbot uses OpenAI's API with function calling to dynamically access
 * portfolio data and provide contextual responses based on the current page.
 */

import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { buildDynamicContext } from '@/lib/ai/context-builder';
import Analytics from '@/models/Analytics';
import ChatLog from '@/models/ChatLog'; // Import the new ChatLog model
import dbConnect from '@/lib/dbConnect';
import Project from '@/models/Project';
import Article from '@/models/Article';
import { performSearch } from '@/lib/search/search';
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

// Tools are now imported from chatbot-utils

// =================================================================================
// 3. MAIN API ROUTE (POST HANDLER)
// =================================================================================

/**
 * Handles POST requests to the chat API endpoint.
 * Processes user messages, manages conversation history, executes tool calls,
 * and streams AI responses back to the client.
 *
 * @async
 * @function POST
 * @param {Request} request - Next.js request object
 * @returns {Promise<NextResponse>} Streaming response with AI-generated content or JSON error response
 */
export async function POST(request) {
  console.log('\n[Chat API] 🚀 ======== NEW CHAT REQUEST ======== ');
  const startTime = Date.now(); // Start timer for execution time
  try {
    const {
      userMessage,
      chatHistory = [],
      sessionId,
      path = '/',
      useGraph = false,
    } = await request.json();
    console.log('[Chat API] 📨 User message:', userMessage);
    console.log('[Chat API] 📍 Path:', path);
    console.log('[Chat API] 🔑 Session ID:', sessionId);
    console.log('[Chat API] 💬 Chat history length:', chatHistory.length);

    if (!userMessage) {
      console.error('[Chat API] ❌ No user message provided');
      return NextResponse.json({ error: 'User message is required' }, { status: 400 });
    }

    // Use graph-based implementation if requested
    if (useGraph) {
      console.log('[Chat API] 🤖 Using graph-based implementation');
      const stream = await executeChatbotGraph({ userMessage, chatHistory, path, sessionId });
      return new NextResponse(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    }

    console.log('[Chat API] 🏗️ Building dynamic context...');
    let context;
    try {
      context = await buildDynamicContext();
      console.log('[Chat API] ✅ Context built successfully');
      console.log('[Chat API] 🤖 AI Name:', context.chatbotSettings?.aiName || 'Using defaults');
      console.log(
        '[Chat API] ⚙️ Model:',
        context.chatbotSettings?.modelName || process.env.OPENAI_MODEL_NAME
      );
      console.log('[Chat API] 🔌 Chatbot active:', context.chatbotSettings?.isActive !== false);
    } catch (error) {
      console.error('[Chat API] ❌ Error building context:', error);
      // Use fallback context
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
      console.log('[Chat API] 🔄 Using fallback context due to error');
    }

    if (context.chatbotSettings?.isActive === false) {
      console.warn('[Chat API] ⚠️ Chatbot is disabled');
      return NextResponse.json({ error: 'Chatbot is currently disabled' }, { status: 503 });
    }

    const actualModel =
      context.chatbotSettings?.modelName || process.env.OPENAI_MODEL_NAME || 'gpt-3.5-turbo';

    console.log('[Chat API] 📝 Building system messages...');
    const systemMessages = buildSystemMessages(context, path);
    const messages = [
      ...systemMessages,
      ...chatHistory.map((msg) => ({ role: msg.role, content: msg.content })),
      { role: 'user', content: userMessage },
    ];
    console.log('[Chat API] 📊 Total messages in conversation:', messages.length);

    // Iterative tool calling with max iterations
    const MAX_ITERATIONS = 3;
    const MAX_CONTEXT_CHARS = 50000; // Increased limit for larger contexts
    const ENABLE_PRUNING = true; // Keep only latest tool results
    let toolsUsed = [];
    let iteration = 0;
    let shouldContinue = true;

    console.log(`[Chat API] 🔄 Starting iterative tool calling (max: ${MAX_ITERATIONS} rounds)...`);
    console.log(
      `[Chat API] ✂️ Pruning: ${ENABLE_PRUNING ? 'ENABLED' : 'DISABLED'} (max: ${MAX_CONTEXT_CHARS} chars)`
    );

    while (shouldContinue && iteration < MAX_ITERATIONS) {
      iteration++;
      console.log(
        `[Chat API] 🎯 Iteration ${iteration}/${MAX_ITERATIONS}: Sending completion request...`
      );

      // Calculate and log context size
      const currentContextSize = calculateContextSize(messages);
      console.log(
        `[Chat API] 📏 Current context size: ${currentContextSize} chars (${messages.length} messages)`
      );

      // Prune context if needed before API call (only if enabled)
      const prunedMessages = ENABLE_PRUNING ? pruneContext(messages, MAX_CONTEXT_CHARS) : messages;
      const finalContextSize = calculateContextSize(prunedMessages);

      if (ENABLE_PRUNING && currentContextSize !== finalContextSize) {
        console.log(
          `[Chat API] ✂️ After pruning: ${finalContextSize} chars (${prunedMessages.length} messages)`
        );
      }

      const completion = await openai.chat.completions.create({
        model: actualModel,
        messages: prunedMessages,
        tools: tools,
        tool_choice: 'auto',
      });

      const response = completion.choices[0].message;
      console.log(`[Chat API] 📥 Iteration ${iteration} response received`);

      if (response.tool_calls) {
        console.log(
          `[Chat API] 🛠️ Iteration ${iteration}: AI requested ${response.tool_calls.length} tool call(s)`
        );
        messages.push(response);

        // Execute all tools in this iteration
        for (const toolCall of response.tool_calls) {
          const toolResult = await executeToolCall(toolCall);
          const resultSize = JSON.stringify(toolResult).length;
          console.log(
            `[Chat API] ✅ Tool ${toolCall.function.name} executed successfully (result: ${resultSize} chars)`
          );

          // Limit tool result size for database storage (truncate if too large)
          const MAX_TOOL_RESULT_SIZE = 5000; // characters
          const resultString = JSON.stringify(toolResult);
          const isTruncated = resultString.length > MAX_TOOL_RESULT_SIZE;

          if (isTruncated) {
            console.log(
              `[Chat API] ⚠️ Tool result truncated: ${resultString.length} → ${MAX_TOOL_RESULT_SIZE} chars`
            );
          }

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
            iteration: iteration,
            result: truncatedResult,
          });

          const toolMessage = {
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(toolResult),
          };
          messages.push(toolMessage);

          console.log(
            `[Chat API] 📈 Context grew by ${resultSize} chars (now ${calculateContextSize(messages)} chars)`
          );
        }

        console.log(
          `[Chat API] 🔄 Iteration ${iteration} complete, checking if AI needs more tools...`
        );
      } else {
        console.log(`[Chat API] ✅ No tool calls in iteration ${iteration} - AI has enough info`);
        shouldContinue = false;
      }
    }

    if (iteration >= MAX_ITERATIONS && shouldContinue) {
      console.log('[Chat API] ⚠️ Reached max iterations limit');
    }

    const totalContextSize = calculateContextSize(messages);
    console.log(
      `[Chat API] 🏁 Tool calling complete. Total iterations: ${iteration}, Total tools used: ${toolsUsed.length}`
    );
    console.log(`[Chat API] 📊 CONTEXT GROWTH SUMMARY:
      🔢 Total messages: ${messages.length}
      📏 Total size: ${totalContextSize} chars
      📈 Growth: ${totalContextSize - calculateContextSize(systemMessages)} chars added`);

    console.log('[Chat API] 🌊 Starting streaming response...');

    // Prune context one final time before streaming (only if enabled)
    const finalMessages = ENABLE_PRUNING ? pruneContext(messages, MAX_CONTEXT_CHARS) : messages;
    const finalSize = calculateContextSize(finalMessages);
    console.log(
      `[Chat API] 📏 Final context size: ${finalSize} chars (${finalMessages.length} messages)`
    );
    console.log(`[Chat API] 📊 Context breakdown:
      - System messages: ${messages.filter((m) => m.role === 'system').length}
      - User messages: ${messages.filter((m) => m.role === 'user').length}
      - Assistant messages: ${messages.filter((m) => m.role === 'assistant').length}
      - Tool messages: ${messages.filter((m) => m.role === 'tool').length}`);

    // Create complete conversation context for debugging (includes all system messages)
    // Only include current conversation turn, not previous assistant messages from chat history
    const currentConversationTurn = [
      ...systemMessages, // Always include original system messages
      ...chatHistory.filter((msg) => msg.role !== 'assistant'), // Include chat history but exclude previous assistant messages
      { role: 'user', content: userMessage }, // Current user message
    ];

    console.log(`[Chat API] 🔍 DEBUG - currentConversationTurn construction:`);
    console.log(`[Chat API]   - systemMessages: ${systemMessages.length} messages`);
    console.log(
      `[Chat API]   - filtered chatHistory: ${chatHistory.filter((msg) => msg.role !== 'assistant').length} messages`
    );
    console.log(
      `[Chat API]   - currentConversationTurn: ${currentConversationTurn.length} messages`
    );

    // Validate that we have a proper conversation context
    if (currentConversationTurn.length === 0) {
      console.error(`[Chat API] ❌ currentConversationTurn is empty!`);
      console.error(`[Chat API]   - systemMessages:`, systemMessages);
      console.error(
        `[Chat API]   - filtered chatHistory:`,
        chatHistory.filter((msg) => msg.role !== 'assistant')
      );
    }

    const stream = new ReadableStream({
      async start(controller) {
        let assistantMessage = { content: '' };
        let chunkCount = 0;
        try {
          // Send tool status updates first if tools were used
          if (toolsUsed.length > 0) {
            for (const tool of toolsUsed) {
              const statusMessage = getToolStatusMessage(tool.name, tool.arguments, tool.iteration);
              const statusData = JSON.stringify({ type: 'status', message: statusMessage }) + '\n';
              controller.enqueue(new TextEncoder().encode(statusData));
              console.log('[Chat API] 📢 Sent status:', statusMessage);
            }
          }
          const completion = await openai.chat.completions.create({
            model: actualModel,
            messages: finalMessages,
            stream: true,
          });
          console.log('[Chat API] 📡 Stream established, receiving chunks...');

          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              chunkCount++;
              assistantMessage.content += content;
              // Send content chunks as JSON data packets
              const contentData = JSON.stringify({ type: 'content', message: content }) + '\n';
              controller.enqueue(new TextEncoder().encode(contentData));
            }
          }
          console.log(`[Chat API] ✅ Stream completed. Total chunks: ${chunkCount}`);
          console.log(
            `[Chat API] 📝 Response length: ${assistantMessage.content.length} characters`
          );

          // Only save chat log if there's an actual AI response
          if (!assistantMessage.content || assistantMessage.content.trim().length === 0) {
            console.log('[Chat API] ⚠️ No AI response generated, skipping chat log save');
            controller.close();
            return;
          }

          controller.close();
          // Analytics logic remains the same
          console.log('[Chat API] 💾 Saving analytics event...');
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
          await analyticsEvent.save();
          console.log('[Chat API] ✅ Analytics saved successfully');

          // Limit conversation context size for database storage
          const MAX_CONTEXT_SIZE = 50000; // Increased limit for larger contexts
          const contextString = JSON.stringify(currentConversationTurn);
          const shouldTruncateContext = contextString.length > MAX_CONTEXT_SIZE;

          console.log(
            `[Chat API] 🔍 DEBUG - completeConversationContext length: ${currentConversationTurn.length}`
          );
          console.log(`[Chat API] 🔍 DEBUG - systemMessages length: ${systemMessages.length}`);
          console.log(`[Chat API] 🔍 DEBUG - messages length: ${messages.length}`);
          console.log(`[Chat API] 🔍 DEBUG - contextString length: ${contextString.length}`);
          console.log(`[Chat API] 🔍 DEBUG - shouldTruncateContext: ${shouldTruncateContext}`);

          if (shouldTruncateContext) {
            console.log(
              `[Chat API] ⚠️ Conversation context truncated: ${contextString.length} → ${MAX_CONTEXT_SIZE} chars`
            );
          }

          const finalContextForDB = shouldTruncateContext
            ? [
                {
                  role: 'system',
                  content: `Conversation context truncated for storage. Original size: ${contextString.length} chars. Contains ${currentConversationTurn.length} messages. System messages preserved for debugging.`,
                },
                ...currentConversationTurn.filter((m) => m.role === 'system'),
              ]
            : currentConversationTurn;

          console.log(
            `[Chat API] 🔍 DEBUG - finalContextForDB length: ${finalContextForDB.length}`
          );
          console.log(
            `[Chat API] 🔍 DEBUG - finalContextForDB first item role: ${finalContextForDB[0]?.role}`
          );
          console.log(
            `[Chat API] 🔍 DEBUG - finalContextForDB first item preview: ${finalContextForDB[0]?.content?.substring(0, 100)}...`
          );

          // Save the chat log to the database
          console.log('[Chat API] 💾 Saving chat log...');
          console.log(
            `[Chat API] 📊 Conversation context size: ${JSON.stringify(finalContextForDB).length} chars`
          );
          console.log(`[Chat API] 🔢 Messages in context: ${finalContextForDB.length}`);
          console.log(`[Chat API] 🛠️ Tools used: ${toolsUsed.length}`);

          const executionTime = Date.now() - startTime;
          const chatLog = new ChatLog({
            sessionId,
            path,
            userMessage,
            aiResponse: assistantMessage.content,
            modelName: actualModel,
            conversationContext: finalContextForDB,
            toolsUsed,
            executionTime,
          });

          console.log('[Chat API] 💾 ChatLog object before save:');
          console.log(`[Chat API] 📋 sessionId: ${chatLog.sessionId}`);
          console.log(
            `[Chat API] 📋 conversationContext length: ${chatLog.conversationContext?.length || 0}`
          );
          console.log(
            `[Chat API] 📋 conversationContext type: ${Array.isArray(chatLog.conversationContext) ? 'Array' : typeof chatLog.conversationContext}`
          );
          console.log(`[Chat API] 📋 toolsUsed length: ${chatLog.toolsUsed?.length || 0}`);

          try {
            const savedLog = await chatLog.save();
            console.log(
              `[Chat API] ✅ Chat log saved successfully (includes ${shouldTruncateContext ? 'truncated ' : ''}conversation context)`
            );
            console.log(`[Chat API] 💾 Saved log ID: ${savedLog._id}`);
            console.log(
              `[Chat API] 📋 Saved conversation context length: ${savedLog.conversationContext?.length || 0}`
            );
            console.log(
              `[Chat API] 📋 Saved conversation context type: ${Array.isArray(savedLog.conversationContext) ? 'Array' : typeof savedLog.conversationContext}`
            );
            console.log(`[Chat API] 📋 Saved toolsUsed length: ${savedLog.toolsUsed?.length || 0}`);

            // Verify the field was actually saved
            if (savedLog.conversationContext && savedLog.conversationContext.length > 0) {
              console.log(
                `[Chat API] ✅ Conversation context saved successfully: ${savedLog.conversationContext.length} messages`
              );
              console.log(
                `[Chat API] 📋 First message role: ${savedLog.conversationContext[0]?.role}`
              );
              console.log(
                `[Chat API] 📋 First message preview: ${savedLog.conversationContext[0]?.content?.substring(0, 100)}...`
              );
            } else {
              console.log(`[Chat API] ❌ Conversation context not saved properly!`);
            }

            console.log(
              `[Chat API] 📋 Conversation context preview: ${JSON.stringify(finalContextForDB.slice(0, 2)).substring(0, 100000000)}...`
            );
          } catch (saveError) {
            console.error(`[Chat API] ❌ Error saving chat log:`, saveError);
            console.error(`[Chat API] 📋 ChatLog object:`, JSON.stringify(chatLog, null, 2));
            throw saveError;
          }
          console.log('[Chat API] 🏁 ======== REQUEST COMPLETE ======== \n');
        } catch (error) {
          console.error('[Chat API] ❌ Stream error:', error);
          controller.error(error);
        }
      },
    });

    console.log('[Chat API] 📤 Returning stream response');
    return new NextResponse(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  } catch (error) {
    console.error('[Chat API] 💥 FATAL ERROR:', error);
    console.error('[Chat API] Stack trace:', error.stack);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// =================================================================================
// 4. UPDATED SYSTEM INSTRUCTIONS
// =================================================================================

/**
 * Builds system messages that define the AI's behavior and capabilities.
 * Creates context-aware instructions based on chatbot settings and current page.
 *
 * @function buildSystemMessages
 * @param {Object} context - Dynamic context object from context builder
 * @param {Object} context.chatbotSettings - Chatbot configuration settings
 * @param {string} context.chatbotSettings.aiName - Name of the AI assistant
 * @param {string} context.chatbotSettings.persona - AI personality description
 * @param {string} context.chatbotSettings.callToAction - CTA message for users
 * @param {Array<string>} context.chatbotSettings.rules - Behavioral rules for the AI
 * @param {string} path - Current page path the user is on
 * @returns {Array<{role: string, content: string}>} Array of system message objects
 */
export function buildSystemMessages(context, path) {
  const { chatbotSettings } = context || {};

  // Fallback defaults if chatbotSettings is missing
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
  const messages = [];

  messages.push({
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
- Examples: [Design Your App](https://hasanraiyan.vercel.app/projects/design-your-app), [React Performance](https://hasanraiyan.vercel.app/blog/react-perf)

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
  });

  return messages;
}
