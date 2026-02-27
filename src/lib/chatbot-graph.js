/**
 * @fileoverview LangGraph-based chatbot implementation.
 * Uses a graph-based state machine architecture for AI agent behaviour.
 */

import { StateGraph, START, END, Annotation } from '@langchain/langgraph';
import OpenAI from 'openai';
import { buildDynamicContext } from '@/lib/ai/context-builder';
import { buildSystemMessages } from '@/app/api/chat/route';
import {
  tools as chatbotTools,
  executeToolCall,
  getToolStatusMessage,
  pruneContext,
} from '@/lib/chatbot-utils';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
});

// Define the state structure
const ChatbotState = Annotation.Root({
  messages: Annotation(),
  userMessage: Annotation(),
  chatHistory: Annotation(),
  path: Annotation(),
  context: Annotation(),
  toolsUsed: Annotation(),
  iteration: Annotation(),
  shouldContinue: Annotation(),
  finalMessages: Annotation(),
  streamController: Annotation(),
  toolCalls: Annotation(),
  aiResponse: Annotation(),
});

// =================================================================================
// GRAPH NODES
// =================================================================================

function sendStatus(controller, message) {
  if (!controller) return;
  controller.enqueue(
    new TextEncoder().encode(JSON.stringify({ type: 'node_status', message }) + '\n')
  );
}

async function initializeState(state) {
  sendStatus(state.streamController, '🤖 Initializing conversation...');

  const { userMessage, chatHistory = [], path = '/' } = state;
  const context = await buildDynamicContext();

  if (context.chatbotSettings?.isActive === false) {
    throw new Error('Chatbot is currently disabled');
  }

  const systemMessages = buildSystemMessages(context, path);
  const messages = [
    ...systemMessages,
    ...chatHistory.map((msg) => ({ role: msg.role, content: msg.content })),
    { role: 'user', content: userMessage },
  ];

  return { ...state, messages, context, toolsUsed: [], iteration: 0, shouldContinue: true };
}

async function shouldCallTools(state) {
  const { messages, iteration, streamController } = state;
  const MAX_ITERATIONS = 3;

  if (iteration >= MAX_ITERATIONS) {
    return { ...state, shouldContinue: false };
  }

  sendStatus(streamController, `🔍 Analyzing request (step ${iteration + 1})...`);

  const prunedMessages = pruneContext(messages, 50000);
  const completion = await openai.chat.completions.create({
    model:
      state.context.chatbotSettings?.modelName || process.env.OPENAI_MODEL_NAME || 'gpt-3.5-turbo',
    messages: prunedMessages,
    tools: chatbotTools,
    tool_choice: 'auto',
  });

  const response = completion.choices[0].message;

  if (response.tool_calls) {
    sendStatus(streamController, `🛠️ Found ${response.tool_calls.length} action(s) to take`);
    return {
      ...state,
      messages: [...messages, response],
      toolCalls: response.tool_calls,
      shouldContinue: true,
      iteration: iteration + 1,
    };
  }

  return { ...state, messages: [...messages, response], shouldContinue: false };
}

async function executeTools(state) {
  const { messages, toolCalls, toolsUsed, iteration, streamController } = state;

  sendStatus(streamController, `⚡ Executing ${toolCalls.length} action(s)...`);

  let updatedMessages = [...messages];
  let updatedToolsUsed = [...toolsUsed];

  for (const toolCall of toolCalls) {
    if (streamController) {
      const statusMessage = getToolStatusMessage(
        toolCall.function.name,
        JSON.parse(toolCall.function.arguments),
        iteration
      );
      streamController.enqueue(
        new TextEncoder().encode(JSON.stringify({ type: 'status', message: statusMessage }) + '\n')
      );
    }

    const toolResult = await executeToolCall(toolCall);
    updatedToolsUsed.push({
      name: toolCall.function.name,
      arguments: JSON.parse(toolCall.function.arguments),
      iteration,
      result: toolResult,
    });
    updatedMessages.push({
      role: 'tool',
      tool_call_id: toolCall.id,
      content: JSON.stringify(toolResult),
    });
  }

  return { ...state, messages: updatedMessages, toolsUsed: updatedToolsUsed };
}

async function generateResponse(state) {
  const { messages, streamController } = state;

  sendStatus(streamController, '🧠 Crafting response...');

  const finalMessages = pruneContext(messages, 50000);
  const completion = await openai.chat.completions.create({
    model:
      state.context.chatbotSettings?.modelName || process.env.OPENAI_MODEL_NAME || 'gpt-3.5-turbo',
    messages: finalMessages,
    stream: true,
  });

  let assistantMessage = { content: '' };

  for await (const chunk of completion) {
    const content = chunk.choices[0]?.delta?.content || '';
    if (content) {
      assistantMessage.content += content;
      if (streamController) {
        streamController.enqueue(
          new TextEncoder().encode(JSON.stringify({ type: 'content', message: content }) + '\n')
        );
      }
    }
  }

  return { ...state, aiResponse: assistantMessage.content, finalMessages };
}

// =================================================================================
// GRAPH DEFINITION
// =================================================================================

const workflow = new StateGraph(ChatbotState);

workflow.addNode('initialize', initializeState);
workflow.addNode('check_tools', shouldCallTools);
workflow.addNode('execute_tools', executeTools);
workflow.addNode('generate_response', generateResponse);

workflow.addEdge(START, 'initialize');
workflow.addEdge('initialize', 'check_tools');
workflow.addConditionalEdges('check_tools', (state) =>
  state.shouldContinue ? 'execute_tools' : 'generate_response'
);
workflow.addEdge('execute_tools', 'check_tools');
workflow.addEdge('generate_response', END);

const chatbotGraph = workflow.compile();

// =================================================================================
// MAIN EXECUTION FUNCTION
// =================================================================================

export async function executeChatbotGraph({
  userMessage,
  chatHistory = [],
  path = '/',
  sessionId,
}) {
  const stream = new ReadableStream({
    async start(controller) {
      try {
        let state = {
          userMessage,
          chatHistory,
          path,
          sessionId,
          streamController: controller,
          messages: [],
          context: {},
          toolsUsed: [],
          iteration: 0,
          shouldContinue: true,
          toolCalls: [],
          aiResponse: '',
        };

        state = await initializeState(state);
        state = await shouldCallTools(state);

        while (state.shouldContinue && state.iteration < 3) {
          state = await executeTools(state);
          state = await shouldCallTools(state);
        }

        state = await generateResponse(state);
        controller.close();
      } catch (error) {
        console.error('[Chatbot Graph] Execution error:', error);
        controller.error(error);
      }
    },
  });

  return stream;
}

export { chatbotGraph, ChatbotState };
