/**
 * @fileoverview LangGraph-based chatbot implementation
 * Uses graph-based state machine architecture for AI agent behavior
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
// GRAPH NODES - Each represents a step in the conversation flow
// =================================================================================

/**
 * Initialize the conversation state with user input and context
 */
async function initializeState(state) {
  console.log('[Graph] 🏁 Initializing conversation state...');

  // Send status update to UI
  if (state.streamController) {
    const statusData =
      JSON.stringify({
        type: 'node_status',
        node: 'initialize',
        status: 'running',
        message: '🤖 Initializing conversation...',
      }) + '\n';
    state.streamController.enqueue(new TextEncoder().encode(statusData));
  }

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

  console.log('[Graph] ✅ State initialized with', messages.length, 'messages');

  // Send completion status
  if (state.streamController) {
    const statusData =
      JSON.stringify({
        type: 'node_status',
        node: 'initialize',
        status: 'completed',
        message: '✅ Conversation initialized',
      }) + '\n';
    state.streamController.enqueue(new TextEncoder().encode(statusData));
  }

  return {
    ...state,
    messages,
    context,
    toolsUsed: [],
    iteration: 0,
    shouldContinue: true,
  };
}

/**
 * Decide whether the AI needs to call tools or can generate a response
 */
async function shouldCallTools(state) {
  const { messages, iteration, streamController } = state;
  const MAX_ITERATIONS = 3;

  if (iteration >= MAX_ITERATIONS) {
    console.log('[Graph] 🛑 Reached max iterations, proceeding to response');
    return { ...state, shouldContinue: false };
  }

  console.log(
    `[Graph] 🤔 Checking if tools needed (iteration ${iteration + 1}/${MAX_ITERATIONS})...`
  );

  // Send status update
  if (streamController) {
    const statusData =
      JSON.stringify({
        type: 'node_status',
        node: 'check_tools',
        status: 'running',
        message: `🔍 Analyzing request (Step ${iteration + 1})...`,
      }) + '\n';
    streamController.enqueue(new TextEncoder().encode(statusData));
  }

  const prunedMessages = pruneContext(messages, 50000);

  const completion = await openai.chat.completions.create({
    model:
      state.context.chatbotSettings?.modelName || process.env.OPENAI_MODEL_NAME || 'gpt-3.5-turbo',
    messages: prunedMessages,
    tools: getTools(),
    tool_choice: 'auto',
  });

  const response = completion.choices[0].message;

  if (response.tool_calls) {
    console.log(`[Graph] 🛠️ AI requested ${response.tool_calls.length} tool call(s)`);

    // Send status update for tool calls
    if (streamController) {
      const statusData =
        JSON.stringify({
          type: 'node_status',
          node: 'check_tools',
          status: 'completed',
          message: `🛠️ Found ${response.tool_calls.length} action(s) to take`,
        }) + '\n';
      streamController.enqueue(new TextEncoder().encode(statusData));
    }

    return {
      ...state,
      messages: [...messages, response],
      toolCalls: response.tool_calls,
      shouldContinue: true,
      iteration: iteration + 1,
    };
  } else {
    console.log('[Graph] ✅ No tools needed, proceeding to response');

    // Send status update for direct response
    if (streamController) {
      const statusData =
        JSON.stringify({
          type: 'node_status',
          node: 'check_tools',
          status: 'completed',
          message: '✨ Ready to respond directly',
        }) + '\n';
      streamController.enqueue(new TextEncoder().encode(statusData));
    }

    return {
      ...state,
      messages: [...messages, response],
      shouldContinue: false,
    };
  }
}

/**
 * Execute the requested tools and add results to conversation
 */
async function executeTools(state) {
  const { messages, toolCalls, toolsUsed, iteration, streamController } = state;

  console.log(`[Graph] 🔧 Executing ${toolCalls.length} tool(s) in iteration ${iteration}...`);

  // Send node status update
  if (streamController) {
    const statusData =
      JSON.stringify({
        type: 'node_status',
        node: 'execute_tools',
        status: 'running',
        message: `⚡ Executing ${toolCalls.length} action(s)...`,
      }) + '\n';
    streamController.enqueue(new TextEncoder().encode(statusData));
  }

  let updatedMessages = [...messages];
  let updatedToolsUsed = [...toolsUsed];

  for (const toolCall of toolCalls) {
    // Send status update to client
    if (streamController) {
      const statusMessage = getToolStatusMessage(
        toolCall.function.name,
        JSON.parse(toolCall.function.arguments),
        iteration
      );
      const statusData = JSON.stringify({ type: 'status', message: statusMessage }) + '\n';
      streamController.enqueue(new TextEncoder().encode(statusData));
    }

    const toolResult = await executeToolCall(toolCall);

    updatedToolsUsed.push({
      name: toolCall.function.name,
      arguments: JSON.parse(toolCall.function.arguments),
      iteration,
      result: toolResult,
    });

    const toolMessage = {
      role: 'tool',
      tool_call_id: toolCall.id,
      content: JSON.stringify(toolResult),
    };

    updatedMessages.push(toolMessage);
  }

  console.log(`[Graph] ✅ Executed ${toolCalls.length} tool(s) successfully`);

  // Send completion status
  if (streamController) {
    const statusData =
      JSON.stringify({
        type: 'node_status',
        node: 'execute_tools',
        status: 'completed',
        message: `✅ Completed ${toolCalls.length} action(s)`,
      }) + '\n';
    streamController.enqueue(new TextEncoder().encode(statusData));
  }

  return {
    ...state,
    messages: updatedMessages,
    toolsUsed: updatedToolsUsed,
  };
}

/**
 * Generate the final AI response
 */
async function generateResponse(state) {
  const { messages, streamController } = state;

  console.log('[Graph] 🌊 Generating final response...');

  // Send node status update
  if (streamController) {
    const statusData =
      JSON.stringify({
        type: 'node_status',
        node: 'generate_response',
        status: 'running',
        message: '🧠 Crafting response...',
      }) + '\n';
    streamController.enqueue(new TextEncoder().encode(statusData));
  }

  const finalMessages = pruneContext(messages, 50000);

  const completion = await openai.chat.completions.create({
    model:
      state.context.chatbotSettings?.modelName || process.env.OPENAI_MODEL_NAME || 'gpt-3.5-turbo',
    messages: finalMessages,
    stream: true,
  });

  let assistantMessage = { content: '' };
  let chunkCount = 0;

  for await (const chunk of completion) {
    const content = chunk.choices[0]?.delta?.content || '';
    if (content) {
      chunkCount++;
      assistantMessage.content += content;

      if (streamController) {
        const contentData = JSON.stringify({ type: 'content', message: content }) + '\n';
        streamController.enqueue(new TextEncoder().encode(contentData));
      }
    }
  }

  console.log(
    `[Graph] ✅ Response generated (${chunkCount} chunks, ${assistantMessage.content.length} chars)`
  );

  // Send completion status
  if (streamController) {
    const statusData =
      JSON.stringify({
        type: 'node_status',
        node: 'generate_response',
        status: 'completed',
        message: '✨ Response ready',
      }) + '\n';
    streamController.enqueue(new TextEncoder().encode(statusData));
  }

  return {
    ...state,
    aiResponse: assistantMessage.content,
    finalMessages,
  };
}

// =================================================================================
// GRAPH DEFINITION
// =================================================================================

const workflow = new StateGraph(ChatbotState);

// Add nodes
workflow.addNode('initialize', initializeState);
workflow.addNode('check_tools', shouldCallTools);
workflow.addNode('execute_tools', executeTools);
workflow.addNode('generate_response', generateResponse);

// Define the flow
workflow.addEdge(START, 'initialize');
workflow.addEdge('initialize', 'check_tools');

// Conditional edge from check_tools
workflow.addConditionalEdges('check_tools', (state) => {
  return state.shouldContinue ? 'execute_tools' : 'generate_response';
});

// Loop back from execute_tools to check_tools for more iterations
workflow.addEdge('execute_tools', 'check_tools');

// End at generate_response
workflow.addEdge('generate_response', END);

// Compile the graph
const chatbotGraph = workflow.compile();

// =================================================================================
// UTILITY FUNCTIONS (imported/adapted from original route.js)
// =================================================================================

function getTools() {
  return chatbotTools;
}

// Tool functions are now imported from chatbot-utils

// =================================================================================
// MAIN EXECUTION FUNCTION
// =================================================================================

/**
 * Executes the chatbot graph for a user request and returns a streaming response
 */
export async function executeChatbotGraph({
  userMessage,
  chatHistory = [],
  path = '/',
  sessionId,
}) {
  console.log('[Graph] 🚀 Starting graph execution...');

  // Create a stream for real-time updates
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Initialize state
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

        // Execute graph nodes sequentially (simulating the graph flow)
        state = await initializeState(state);
        state = await shouldCallTools(state);

        // Loop for tool execution if needed
        while (state.shouldContinue && state.iteration < 3) {
          state = await executeTools(state);
          state = await shouldCallTools(state);
        }

        // Generate final response
        state = await generateResponse(state);

        // Close the stream
        controller.close();
      } catch (error) {
        console.error('[Graph] ❌ Error in graph execution:', error);
        controller.error(error);
      }
    },
  });

  return stream;
}

// =================================================================================
// EXPORTS
// =================================================================================

export { chatbotGraph, ChatbotState };
