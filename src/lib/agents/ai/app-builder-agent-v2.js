/**
 * App Builder Agent V2
 *
 * Generates standalone HTML/JS/Tailwind web applications using a React Agent.
 * Features plan approval with MongoDB checkpointing for human-in-the-loop.
 * Extends BaseAgent.
 */

import { AGENT_IDS } from '@/lib/constants/agents';
import BaseAgent from '../BaseAgent';
import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { StateGraph, START, END, Annotation, interrupt, Command } from '@langchain/langgraph';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { MongoDBSaver } from '@langchain/langgraph-checkpoint-mongodb';
import mongoose from 'mongoose';

const GraphState = Annotation.Root({
  messages: Annotation({
    reducer: (x, y) => x.concat(y),
  }),
  content: Annotation({
    reducer: (x, y) => y,
  }),
  todoList: Annotation({
    reducer: (x, y) => y,
  }),
  planGenerated: Annotation({
    reducer: (x, y) => y ?? x,
  }),
});

class AppBuilderAgent extends BaseAgent {
  constructor(agentId = AGENT_IDS.APP_BUILDER, config = {}) {
    super(agentId, config);
    this.checkpointer = null;
  }

  async _onInitialize() {
    this.logger.info('App Builder Agent V2 Initialized (React Agent with Plan Approval)');

    // Initialize MongoDB checkpointer
    const mongoClient = mongoose.connection.getClient();
    this.checkpointer = new MongoDBSaver({
      client: mongoClient,
      dbName: mongoose.connection.name,
    });
  }

  async _validateInput(input) {
    if (!input || !input.name || !input.description) {
      throw new Error('name and description are required for the App Builder Agent');
    }
  }

  _getTools(state) {
    const savePlanTool = tool(
      async (input) => {
        this.logger.info(`Saving plan with ${input.steps.length} steps`);
        state.todoList = input.steps;
        state.planGenerated = true;

        // Use interrupt() to pause execution and wait for approval
        const approved = interrupt({
          type: 'plan_approval',
          plan: input.steps,
          message: 'Plan generated. Please review and approve to continue.',
        });

        if (!approved) {
          return `Plan was rejected. Please provide new requirements.`;
        }

        return `Plan approved! Proceeding with implementation: ${input.steps.join(', ')}`;
      },
      {
        name: 'save_plan',
        description:
          'Saves the structural plan for the app. Call this FIRST and ONLY ONCE. After calling this, WAIT for user approval before proceeding.',
        schema: z.object({
          steps: z
            .array(z.string())
            .describe('List of structural and functional steps needed to build this app.'),
        }),
      }
    );

    const readCodeTool = tool(
      async () => {
        this.logger.info(`Reading current code`);
        return state.content || 'The document is currently empty.';
      },
      {
        name: 'read_code',
        description: 'Reads the current full HTML document being built.',
        schema: z.object({}),
      }
    );

    const appendCodeTool = tool(
      async (input) => {
        this.logger.info(`Appending code... length: ${input.htmlContent.length}`);
        let html = input.htmlContent;
        // Cleanup markdown artifacts if any
        if (html.startsWith('```html')) {
          html = html.replace(/^```html\n?/, '').replace(/\n?```$/, '');
        } else if (html.startsWith('```')) {
          html = html.replace(/^```\n?/, '').replace(/\n?```$/, '');
        }

        state.content += html;
        return `Code appended successfully. Current document length is ${state.content.length} characters.`;
      },
      {
        name: 'append_code',
        description:
          'Appends HTML code to the end of the current document. Useful for adding the initial shell or large new sections.',
        schema: z.object({
          htmlContent: z.string().describe('The raw HTML string to append.'),
        }),
      }
    );

    const replaceCodeTool = tool(
      async (input) => {
        this.logger.info(`Replacing code block...`);
        const { searchBlock, replaceBlock } = input;

        if (!state.content.includes(searchBlock)) {
          return `Error: Could not find the exact search block in the current document. Try reading the code first to get the exact string.`;
        }

        state.content = state.content.replace(searchBlock, replaceBlock);
        return `Code replaced successfully.`;
      },
      {
        name: 'replace_code',
        description:
          'Replaces a specific block of text in the document. You MUST provide the exact string to search for.',
        schema: z.object({
          searchBlock: z
            .string()
            .describe('The exact string block currently in the document to be replaced.'),
          replaceBlock: z.string().describe('The new string block to replace it with.'),
        }),
      }
    );

    const finishTool = tool(
      async () => {
        this.logger.info(`App building finished.`);
        return `App finished successfully.`;
      },
      {
        name: 'finish',
        description:
          'Call this tool when the application is completely finished and no more code needs to be added or modified.',
        schema: z.object({}),
      }
    );

    return [savePlanTool, readCodeTool, appendCodeTool, replaceCodeTool, finishTool];
  }

  _getSystemPrompt(input, isAfterApproval = false) {
    if (isAfterApproval) {
      return `You are an elite App Builder agent. Continue building the approved application.

App Name: ${input.name}
Description: ${input.description}

The plan has been APPROVED. Now execute it step by step:

1. Start by using \`append_code\` to build the initial HTML structure with Tailwind CSS CDN
2. Use \`read_code\` to check your progress
3. Use \`replace_code\` to refine and improve sections
4. Include proper styling, interactivity, and all required features
5. Make it look professional and polished
6. When completely done, call the \`finish\` tool

YOU MUST NOW BUILD THE APPLICATION. Do not just say you will build it - actually call the tools to write the code!`;
    }

    return `You are an elite App Builder agent. Your job is to iteratively construct complete, single-file HTML/JS/CSS applications.

App Name: ${input.name}
Description: ${input.description}

REQUIREMENTS:
1. You MUST first call the \`save_plan\` tool to outline the architecture and steps.
2. After save_plan, the user will review and approve your plan.
3. Once approved, you will use \`append_code\` and \`replace_code\` to build the application.
4. The HTML MUST use Tailwind CSS via CDN.
5. Design an excellent, modern UI according to the app description.
6. When completely done, call the \`finish\` tool.

Start by calling save_plan with your implementation plan.`;
  }

  /**
   * Start a new app build with plan generation
   */
  async *startBuild(input) {
    const threadId = `app-build-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const state = {
      content: input.initialCode || this._getInitialHTML(input),
      todoList: [],
      planGenerated: false,
    };
    const tools = this._getTools(state);
    const model = await this.createChatModel({ temperature: 0.7 });

    const agent = async (state) => {
      const boundModel = model.bindTools(tools);
      const response = await boundModel.invoke([
        new SystemMessage(this._getSystemPrompt(input)),
        ...state.messages,
      ]);
      return { messages: [response] };
    };

    const shouldContinue = (state) => {
      const lastMessage = state.messages[state.messages.length - 1];

      // If plan was just generated, interrupt before executing tools
      if (lastMessage.tool_calls && lastMessage.tool_calls.length > 0) {
        const hasSavePlan = lastMessage.tool_calls.some((tc) => tc.name === 'save_plan');
        if (hasSavePlan) {
          return 'tools'; // Will be interrupted before tools node
        }
        return 'tools';
      }
      return END;
    };

    const toolNode = new ToolNode(tools);

    const graph = new StateGraph(GraphState)
      .addNode('agent', agent)
      .addNode('tools', toolNode)
      .addEdge('tools', 'agent')
      .addConditionalEdges('agent', shouldContinue)
      .addEdge(START, 'agent');

    // Compile with checkpointer - interrupt() is called within save_plan tool
    const compiledGraph = graph.compile({
      checkpointer: this.checkpointer,
    });

    const config = { configurable: { thread_id: threadId } };
    const initialMessages = [new HumanMessage(`Please build the ${input.name} app.`)];

    // Stream events for real-time UI updates
    const eventStream = compiledGraph.streamEvents(
      {
        messages: initialMessages,
        content: state.content,
        todoList: [],
        planGenerated: false,
      },
      { ...config, version: 'v2' }
    );

    for await (const event of eventStream) {
      if (event.event === 'on_chat_model_stream' && event.data.chunk?.content) {
        yield { type: 'thought', message: event.data.chunk.content };
      } else if (event.event === 'on_tool_start' && event.name === 'save_plan') {
        yield { type: 'status', message: `Generating plan...` };
      }
    }

    // After streaming, check the state for interrupts
    const graphState = await compiledGraph.getState(config);

    this.logger.info(
      `Graph state after execution: ${JSON.stringify({
        next: graphState.next,
        hasTasks: !!graphState.tasks,
        tasksLength: graphState.tasks?.length,
      })}`
    );

    // Check for interrupts - they appear in tasks
    if (graphState.tasks && graphState.tasks.length > 0) {
      for (const task of graphState.tasks) {
        if (task.interrupts && task.interrupts.length > 0) {
          const interruptData = task.interrupts[0].value;
          this.logger.info(`Interrupt detected: ${JSON.stringify(interruptData)}`);

          yield {
            type: 'interrupted',
            threadId,
            plan: interruptData.plan || state.todoList,
            message:
              interruptData.message || 'Execution paused. Please approve the plan to continue.',
          };
          return; // Stop here, wait for approval
        }
      }
    }

    // If no interrupt, the graph completed
    this.logger.info('No interrupt found - graph completed');
  }

  /**
   * Continue build after plan approval
   */
  async *continueBuild(threadId, approved = true, input = null) {
    const config = { configurable: { thread_id: threadId } };

    // Recreate the graph (must be identical to startBuild)
    const stateObj = { content: '', todoList: [], planGenerated: false };
    const tools = this._getTools(stateObj);
    const model = await this.createChatModel({ temperature: 0.7 });

    const agent = async (state) => {
      const boundModel = model.bindTools(tools);
      const response = await boundModel.invoke([
        new SystemMessage(
          this._getSystemPrompt(input || { name: 'App', description: 'Application' }, true)
        ), // true = after approval
        ...state.messages,
      ]);
      return { messages: [response] };
    };

    const shouldContinue = (state) => {
      const lastMessage = state.messages[state.messages.length - 1];
      if (lastMessage.tool_calls && lastMessage.tool_calls.length > 0) {
        return 'tools';
      }
      return END;
    };

    const toolNode = new ToolNode(tools);

    const graph = new StateGraph(GraphState)
      .addNode('agent', agent)
      .addNode('tools', toolNode)
      .addEdge('tools', 'agent')
      .addConditionalEdges('agent', shouldContinue)
      .addEdge(START, 'agent');

    const compiledGraph = graph.compile({ checkpointer: this.checkpointer });

    // Resume execution with Command({ resume: approved })
    // This value becomes the return value of interrupt() inside save_plan
    const eventStream = compiledGraph.streamEvents(new Command({ resume: approved }), {
      ...config,
      version: 'v2',
    });

    for await (const event of eventStream) {
      if (event.event === 'on_chat_model_stream' && event.data.chunk?.content) {
        yield { type: 'thought', message: event.data.chunk.content };
      } else if (
        event.event === 'on_tool_start' &&
        event.name !== 'agent' &&
        event.name !== 'save_plan'
      ) {
        // Show status for actual building tools, not save_plan (already approved)
        const toolMessages = {
          append_code: 'Adding code to the application...',
          replace_code: 'Refining the code...',
          read_code: 'Reviewing current code...',
          format_code: 'Formatting code...',
          finish: 'Finalizing application...',
        };
        yield {
          type: 'status',
          message: toolMessages[event.name] || `Executing: ${event.name}...`,
        };
      } else if (
        event.event === 'on_tool_end' &&
        event.name !== 'agent' &&
        event.name !== 'save_plan'
      ) {
        yield { type: 'tool_result', name: event.name, content: stateObj.content };
      }
    }

    yield { type: 'done', content: stateObj.content, todoList: stateObj.todoList };
  }

  _getInitialHTML(input) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${input.name}</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
  <div id="app" class="min-h-screen bg-gray-50">
    <h1 class="text-3xl font-bold">${input.name}</h1>
    <p>${input.description}</p>
  </div>
</body>
</html>`;
  }

  // Fallback for non-streaming usage if needed
  async _onExecute(input) {
    throw new Error('Use startBuild() and continueBuild() methods instead of execute()');
  }
}

export default AppBuilderAgent;
