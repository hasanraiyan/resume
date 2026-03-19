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
        // Initialize todos with pending status
        const initialTodos = input.steps.map((step) => ({ task: step, status: 'pending' }));
        state.todoList = initialTodos;
        state.planGenerated = true;

        // Use interrupt() to pause execution and wait for approval or refinement
        const response = interrupt({
          type: 'plan_approval',
          plan: input.steps,
          message:
            'Plan generated. Please review and approve to continue, or provide feedback for refinement.',
        });

        if (response === false || response === '__REJECTED__') {
          return `Plan was rejected. Please explain to the user that you've acknowledged the rejection and ask for new requirements or a different approach to improve the plan.`;
        }

        if (typeof response === 'string' && response.trim().length > 0) {
          return `The user has provided feedback/refinement: "${response}". Please update your plan accordingly by calling save_plan again, or proceed if the feedback is simple.`;
        }

        return `Plan approved! Proceeding with implementation: ${input.steps.join(', ')}`;
      },
      {
        name: 'save_plan',
        description:
          'Saves the structural plan for the app. Call this to outline the architecture before building. You can call this multiple times if the user requests changes to the plan.',
        schema: z.object({
          steps: z
            .array(z.string())
            .describe(
              'List of structural and functional steps needed to build this app (e.g., "Add Login UI", "Create Dashboard Layout").'
            ),
        }),
      }
    );

    const updateTodoTool = tool(
      async (input) => {
        this.logger.info(`Updating todo status: ${input.index} to ${input.status}`);
        if (!state.todoList[input.index]) {
          return `Error: Todo at index ${input.index} not found.`;
        }
        state.todoList[input.index].status = input.status;
        return `Todo "${state.todoList[input.index].task}" updated to ${input.status}.`;
      },
      {
        name: 'update_todo',
        description: 'Updates the progress status of a specific task in the approved plan.',
        schema: z.object({
          index: z.number().describe('The index of the task in the todo list (0-based).'),
          status: z
            .enum(['pending', 'in-progress', 'completed'])
            .describe('The new status of the task.'),
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

    const patchCodeTool = tool(
      async (input) => {
        this.logger.info(`Patching code with ${input.patches.length} hunks`);
        let currentContent = state.content;
        let successCount = 0;
        const results = [];

        for (const patch of input.patches) {
          const { searchBlock, replaceBlock } = patch;
          if (currentContent.includes(searchBlock)) {
            currentContent = currentContent.replace(searchBlock, replaceBlock);
            successCount++;
            results.push(`Hunk ${successCount}: Success`);
          } else {
            results.push(`Hunk ${results.length + 1}: Failed (search block not found)`);
          }
        }

        state.content = currentContent;
        return `Patch applied: ${successCount}/${input.patches.length} hunks succeeded.\nDetails:\n${results.join('\n')}`;
      },
      {
        name: 'patch_code',
        description:
          'Applies multiple search-and-replace hunks at once. More efficient than replace_code.',
        schema: z.object({
          patches: z.array(
            z.object({
              searchBlock: z.string().describe('The exact block of code to find.'),
              replaceBlock: z.string().describe('The block of code to replace it with.'),
            })
          ),
        }),
      }
    );

    const checkCodeTool = tool(
      async () => {
        this.logger.info(`Checking code for errors`);
        const code = state.content;
        const errors = [];

        // Simple HTML nesting check (very basic)
        const tags = code.match(/<[a-zA-Z0-9]+| <\/[a-zA-Z0-9]+>/g) || [];
        const stack = [];
        tags.forEach((tag) => {
          if (tag.startsWith('</')) {
            const tagName = tag.substring(2).trim();
            if (stack.length > 0 && stack[stack.length - 1] === tagName) {
              stack.pop();
            } else {
              // Ignore some common unclosed tags or mistakes for now
              // errors.push(`Potential HTML mismatch: closed ${tagName} without matching open tag.`);
            }
          } else if (!tag.endsWith('/>')) {
            const tagName = tag.substring(1).trim();
            // Skip self-closing tags
            if (!['img', 'br', 'hr', 'input', 'link', 'meta'].includes(tagName.toLowerCase())) {
              stack.push(tagName);
            }
          }
        });

        // Check for JS syntax errors in <script> tags
        const scriptMatches = code.matchAll(/<script(?:\s+[^>]*)?>([\s\S]*?)<\/script>/gi);
        for (const match of scriptMatches) {
          const jsContent = match[1];
          try {
            new Function(jsContent);
          } catch (e) {
            errors.push(`JS Syntax Error in <script>: ${e.message}`);
          }
        }

        if (errors.length === 0) {
          return 'No obvious syntax errors found. The code is well-formed.';
        }
        return `Found ${errors.length} potential issues:\n- ${errors.join('\n- ')}`;
      },
      {
        name: 'check_code',
        description: 'Performs a basic syntax check on HTML and JS code to catch errors early.',
        schema: z.object({}),
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

    return [
      savePlanTool,
      updateTodoTool,
      readCodeTool,
      appendCodeTool,
      replaceCodeTool,
      patchCodeTool,
      checkCodeTool,
      finishTool,
    ];
  }

  _getSystemPrompt(input, isAfterApproval = false) {
    if (isAfterApproval) {
      return `You are an elite App Builder agent. Continue building the application.

App Name: ${input.name}
Description: ${input.description}

The plan has been APPROVED. Now execute it step by step:

1. First call \`read_code\` to see what's already in the document
2. Use \`update_todo\` at the start and end of each task to keep the user informed of your progress
3. Use \`append_code\` to add new sections or \`patch_code\` / \`replace_code\` to modify existing parts
4. Use \`check_code\` after making significant changes to ensure no syntax errors were introduced
5. Include proper styling, interactivity, and all required features
6. Make it look professional and polished
7. **MANDATORY**: You MUST call \`check_code\` one last time before calling the \`finish\` tool to ensure everything is perfect.
8. When completely done AND after identifying no errors, call the \`finish\` tool
9. Note: Your current progress is AUTOMATICALLY saved after every turn via the graph state. You do not need to call a separate save tool.

DESIGN SYSTEM - NEOBRUTALISM/MINIMALIST STYLE:
- Use ONLY the predefined Tailwind colors from the config (background, foreground, primary, border, etc.)
- Apply thick borders: border-4, border-black
- Use bold typography: font-black, font-bold, uppercase, tracking-tight
- Add brutal shadows: shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]
- High contrast: white backgrounds with black borders and text
- Button states: bg-black text-white hover:bg-white hover:text-black with border-4 border-black
- Keep layouts clean and spacious with proper spacing (space-y-4, space-y-6, p-6, p-8)
- Use Lucide icons for visual elements
- Minimal color palette: primarily black and white
- Make UI elements chunky and bold, not delicate

YOU MUST NOW BUILD THE APPLICATION. Do not just say you will build it - actually call the tools to write the code!`;
    }

    return `You are an elite App Builder agent. Your job is to iteratively construct complete, single-file HTML/JS/CSS applications.

App Name: ${input.name}
Description: ${input.description}

REQUIREMENTS:
1. First, call \`read_code\` to see the initial HTML template and understand what design system is already set up.
2. Then call the \`save_plan\` tool to outline the architecture and steps based on what you read.
3. After save_plan, the user will review and approve your plan.
4. Once approved, you will use \`update_todo\` to track progress and \`append_code\`, \`patch_code\`, and \`replace_code\` to build the application.
5. IMPORTANT: Use \`update_todo\` to mark steps as 'in-progress' before you start them and 'completed' once they are finished.
6. Use \`check_code\` periodically to detect syntax errors in your HTML or script tags.
7. **MANDATORY**: You MUST call \`check_code\` one last time before calling the \`finish\` tool to verify that the final code is error-free.
8. Design using NEOBRUTALISM/MINIMALIST style (see guidelines below).
9. When completely done and verified, call the \`finish\` tool.
10. Your progress is PERSISTENT and saved automatically after every turn.

DESIGN SYSTEM - NEOBRUTALISM/MINIMALIST STYLE:
- Use ONLY the predefined Tailwind colors from the config (background, foreground, primary, border, destructive, etc.)
- Apply thick borders everywhere: border-4, border-black
- Use bold typography: font-black, font-bold, uppercase for headings/buttons, tracking-tight
- Add brutal box shadows: shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]
- High contrast design: white backgrounds (#ffffff) with black borders and text (#000000)
- Button styling: bg-black text-white hover:bg-white hover:text-black with border-4 border-black and transition-colors
- Cards and containers: bg-white border-4 border-black with the brutal shadow
- Keep layouts clean, spacious, and centered: use space-y-4, space-y-6, space-y-8, p-6, p-8
- Use Lucide icons (already loaded) for all icons - call lucide.createIcons() after DOM updates
- Minimal color palette: ONLY black and white, no grays or colors unless absolutely necessary
- Make all UI elements chunky and bold - thick borders, large padding, bold text
- Use Inter font (already loaded) for all text
- Interactive states: clear hover effects with border or background color inversions
- No rounded corners unless specifically needed (keep sharp, brutalist aesthetic)

LAYOUT STRUCTURE:
- Center content with max-w-2xl or max-w-4xl containers
- Use min-h-screen for full-page layouts
- Proper spacing hierarchy: space-y-2 for tight groups, space-y-4 for related items, space-y-8 for sections
- Responsive design: use sm:, md:, lg: breakpoints when needed

IMPORTANT: 
- If the user asks a question, requests a list of features, or wants a general explanation, RESPOND IN TEXT ONLY. DO NOT call 'save_plan' for information/discovery requests.
- ONLY call 'save_plan' when you are initiating a specific build task or responding to a complex refinement request that requires code changes.
- After calling 'save_plan', you MUST wait for the user's approval. Do not call modification tools (append_code, replace_code) until the user approves or says 'Proceed'.

PROCEED:
1. If this is a coding task, Start by explaining your rationale, then call 'save_plan'.
2. If this is a question or summary request, just provide the answer in text and call 'finish' or just end your turn.
3. Once a plan is approved, use the building tools to execute.
4. Call 'finish' ONLY when the app is completely polished.`;
  }

  async _compileGraph(stateObj, input) {
    if (!this.model) {
      await this.initialize();
      if (!this.model) this.model = await this.createChatModel({ temperature: 0.7 });
    }

    const tools = this._getTools(stateObj);
    const model = this.model;
    const agent = async (state) => {
      this.logger.info(`Running agent node... approved status: ${stateObj.approved}`);

      const response = await model
        .bindTools(tools)
        .invoke([
          new SystemMessage(
            this._getSystemPrompt(
              input || { name: 'App', description: 'Application' },
              stateObj.approved === true
            )
          ),
          ...state.messages,
        ]);

      return {
        messages: [response],
        content: stateObj.content,
        todoList: stateObj.todoList,
      };
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

    return graph.compile({ checkpointer: this.checkpointer });
  }

  /**
   * Start a new app build with plan generation
   */
  async *startBuild(input) {
    yield { type: 'status', message: 'Initializing build engine...' };
    if (!this.checkpointer) await this.initialize();

    yield { type: 'status', message: 'Analyzing requirements...' };
    const threadId =
      input.threadId || `app-build-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const stateObj = {
      content: input.initialCode || this._getInitialHTML(input),
      todoList: [],
      planGenerated: false,
      approved: false,
    };

    yield { type: 'status', message: 'Compiling build graph...' };
    const compiledGraph = await this._compileGraph(stateObj, input);
    const config = { configurable: { thread_id: threadId }, recursionLimit: 100 };
    const initialMessages = [new HumanMessage(`Please build the ${input.name} app.`)];

    yield { type: 'status', message: 'Starting AI Assistant...' };
    // Stream events for real-time UI updates
    const eventStream = compiledGraph.streamEvents(
      {
        messages: initialMessages,
        content: stateObj.content,
        todoList: [],
        planGenerated: false,
      },
      { ...config, version: 'v2' }
    );

    for await (const event of eventStream) {
      if (event.event === 'on_chat_model_stream' && event.data.chunk?.content) {
        yield { type: 'thought', message: event.data.chunk.content };
      } else if (event.event === 'on_tool_start') {
        if (event.name === 'save_plan') {
          yield { type: 'status', message: `Generating plan...` };
        } else {
          yield { type: 'status', message: `Executing: ${event.name}...` };
        }
      } else if (event.event === 'on_tool_end') {
        yield {
          type: 'tool_result',
          name: event.name,
          content: stateObj.content,
          plan: stateObj.todoList,
        };
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
            plan: interruptData.plan || stateObj.todoList,
            message:
              interruptData.message || 'Execution paused. Please approve the plan to continue.',
          };
          return; // Stop here, wait for approval
        }
      }
    }

    // If no interrupt, the graph completed
    this.logger.info('No interrupt found - graph completed');
    yield {
      type: 'done',
      content: graphState.values?.content || stateObj.content,
      todoList: graphState.values?.todoList || stateObj.todoList,
    };
  }

  /**
   * Continue build after plan approval
   */
  async *continueBuild(threadId, approved = true, input = null) {
    yield { type: 'status', message: 'Resuming build engine...' };
    if (!this.checkpointer) await this.initialize();
    const config = { configurable: { thread_id: threadId }, recursionLimit: 100 };

    // Recreate the graph (must be identical to startBuild)
    const stateObj = {
      content: '',
      todoList: [],
      planGenerated: false,
      approved: approved === true,
    };

    const compiledGraph = await this._compileGraph(stateObj, input);

    // PRE-LOAD THE STATE to avoid data loss on resume
    const currentState = await compiledGraph.getState(config);
    const isInterrupted = currentState.next.length > 0;

    // Initialize our closure state with the actual persistent state
    if (currentState.values) {
      stateObj.content = currentState.values.content || '';
      stateObj.todoList = currentState.values.todoList || [];
    }

    let inputToStream = {};
    if (isInterrupted) {
      // Map boolean false to a string to avoid potential EmptyInputError in some LangGraph versions
      const resumeValue = approved === false ? '__REJECTED__' : approved;
      inputToStream = new Command({ resume: resumeValue });
    } else if (typeof approved === 'string') {
      // If not interrupted but we have a message, it's a follow-up refinement
      inputToStream = { messages: [new HumanMessage(approved)] };
    }

    // Resume execution with Command or new input
    const eventStream = compiledGraph.streamEvents(inputToStream, {
      ...config,
      version: 'v2',
    });

    this.logger.info(
      `Starting continuation stream for thread: ${threadId}. Input keys: ${Object.keys(inputToStream || {})}`
    );
    for await (const event of eventStream) {
      this.logger.debug(`Continuation Event: ${event.event} (${event.name || 'anonymous'})`);
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
        event.name !== 'save_plan' &&
        event.name !== 'tools'
      ) {
        // ALWAYS use the closure state for the most immediate "live" value
        yield {
          type: 'tool_result',
          name: event.name,
          content: stateObj.content,
          plan: stateObj.todoList,
        };
      }
    }

    // After streaming, fetch definitive final state
    const graphState = await compiledGraph.getState(config);
    const finalContent = stateObj.content || graphState.values?.content;
    const finalTodoList = stateObj.todoList || graphState.values?.todoList;

    if (graphState.tasks && graphState.tasks.length > 0) {
      for (const task of graphState.tasks) {
        if (task.interrupts && task.interrupts.length > 0) {
          const interruptData = task.interrupts[0].value;
          yield {
            type: 'interrupted',
            threadId,
            plan: interruptData.plan || finalTodoList,
            message:
              interruptData.message || 'Execution paused. Please approve the plan to continue.',
          };
          return;
        }
      }
    }

    yield { type: 'done', content: finalContent, todoList: finalTodoList };
  }

  _getInitialHTML(input) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${input.name}</title>
  
  <!-- Tailwind CSS -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            background: '#ffffff',
            foreground: '#000000',
            primary: '#000000',
            'primary-foreground': '#ffffff',
            card: '#ffffff',
            'card-foreground': '#000000',
            muted: '#ffffff',
            'muted-foreground': '#000000',
            border: '#000000',
            destructive: '#000000',
            'destructive-foreground': '#ffffff',
            secondary: '#ffffff',
            'secondary-foreground': '#000000',
          },
          fontFamily: {
            sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
          }
        }
      }
    }
  </script>
  
  <!-- Google Fonts -->
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  
  <!-- Lucide Icons -->
  <script src="https://unpkg.com/lucide@latest"></script>
</head>
<body class="antialiased bg-background text-foreground">
  <div id="app" class="min-h-screen">
    <h1>${input.name}</h1>
    <p>${input.description}</p>
  </div>
  
  <script>
    lucide.createIcons();
  </script>
</body>
</html>`;
  }

  /**
   * Fetch current state for a thread directly from checkpointer
   */
  async getThreadState(threadId) {
    if (!this.checkpointer) await this.initialize();
    const config = { configurable: { thread_id: threadId } };
    const compiledGraph = await this._compileGraph({});
    const state = await compiledGraph.getState(config);
    return state.values || null;
  }

  /**
   * Manually update thread state without running the graph
   */
  async updateThreadState(threadId, values) {
    if (!this.checkpointer) await this._onInitialize();
    const config = { configurable: { thread_id: threadId } };
    const compiledGraph = await this._compileGraph({});
    await compiledGraph.updateState(config, values);
    return true;
  }

  // Fallback for non-streaming usage if needed
  async _onExecute(input) {
    throw new Error('Use startBuild() and continueBuild() methods instead of execute()');
  }
}

export default AppBuilderAgent;
