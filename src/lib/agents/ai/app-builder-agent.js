/**
 * App Builder Agent
 *
 * Generates standalone HTML/JS/Tailwind web applications using a React Agent.
 * Extends BaseAgent.
 */

import { AGENT_IDS } from '@/lib/constants/agents';
import BaseAgent from '../BaseAgent';
import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { createReactAgent } from '@langchain/langgraph/prebuilt';

class AppBuilderAgent extends BaseAgent {
  constructor(agentId = AGENT_IDS.APP_BUILDER, config = {}) {
    super(agentId, config);
  }

  async _onInitialize() {
    this.logger.info('App Builder Agent Initialized (React Agent)');
  }

  async _validateInput(input) {
    if (!input || !input.name || !input.description) {
      throw new Error('name and description are required for the App Builder Agent');
    }
  }

  _getTools(outputState) {
    const savePlanTool = tool(
      async (input) => {
        this.logger.info(`Saving plan with ${input.steps.length} steps`);
        outputState.todoList = input.steps;
        return `Plan saved successfully. Now proceed to generate the HTML using the append_code tool.`;
      },
      {
        name: 'save_plan',
        description: 'Saves the structural plan for the app. Call this FIRST.',
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
        return outputState.content || 'The document is currently empty.';
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

        outputState.content += html;
        return `Code appended successfully. Current document length is ${outputState.content.length} characters.`;
      },
      {
        name: 'append_code',
        description: 'Appends HTML code to the end of the current document. Useful for adding the initial shell or large new sections.',
        schema: z.object({
          htmlContent: z.string().describe('The raw HTML string to append.'),
        }),
      }
    );

    const replaceCodeTool = tool(
      async (input) => {
        this.logger.info(`Replacing code block...`);
        const { searchBlock, replaceBlock } = input;

        if (!outputState.content.includes(searchBlock)) {
          return `Error: Could not find the exact search block in the current document. Try reading the code first to get the exact string.`;
        }

        outputState.content = outputState.content.replace(searchBlock, replaceBlock);
        return `Code replaced successfully.`;
      },
      {
        name: 'replace_code',
        description: 'Replaces a specific block of text in the document. You MUST provide the exact string to search for.',
        schema: z.object({
          searchBlock: z.string().describe('The exact string block currently in the document to be replaced.'),
          replaceBlock: z.string().describe('The new string block to replace it with.'),
        }),
      }
    );

    const formatCodeTool = tool(
      async () => {
        this.logger.info(`Formatting code...`);
        // Basic naive formatting or cleanup could go here. For now, just a placeholder.
        return `Code formatting acknowledged.`;
      },
      {
        name: 'format_code',
        description: 'Formats the current HTML code.',
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
        description: 'Call this tool when the application is completely finished and no more code needs to be added or modified.',
        schema: z.object({}),
      }
    );

    return [savePlanTool, readCodeTool, appendCodeTool, replaceCodeTool, formatCodeTool, finishTool];
  }

  _getSystemPrompt(input) {
    return `You are an elite App Builder agent. Your job is to iteratively construct complete, single-file HTML/JS/CSS applications.

App Name: ${input.name}
Description: ${input.description}
Design Schema: ${input.designSchema || 'modern'}

REQUIREMENTS:
1. You MUST first call the \`save_plan\` tool to outline the architecture and steps.
2. After saving the plan, use \`append_code\` to build the initial HTML document shell (starting with <!DOCTYPE html>).
3. Use \`read_code\`, \`append_code\`, and \`replace_code\` to iteratively build out the application. Think of this like working in a text editor.
4. The HTML MUST use Tailwind CSS via CDN (<script src="https://cdn.tailwindcss.com"></script>).
5. MUST include any required icons (e.g., FontAwesome or unpkg Lucide) or libraries (e.g., React/Babel via CDN if necessary, or vanilla JS).
6. Vanilla JS is preferred for simplicity unless complex state requires React/Vue.
7. Make sure the UI reflects the requested Design Schema (e.g. minimalist, playful, dashboard).
8. When you are completely done and the app is ready, you MUST call the \`finish\` tool.
`;
  }

  async *_onStreamExecute(input) {
    const outputState = { content: '', todoList: [] };
    const tools = this._getTools(outputState);
    const model = await this.createChatModel({ temperature: 0.7 });

    const agent = createReactAgent({
      llm: model,
      tools,
      messageModifier: this._getSystemPrompt(input),
    });

    const messages = [{ role: 'user', content: `Please build the ${input.name} app.` }];
    const eventStream = await agent.streamEvents({ messages }, { version: 'v2' });

    for await (const event of eventStream) {
      const { event: type, data, name } = event;

      if (type === 'on_chat_model_stream') {
        if (data.chunk?.content) {
          yield { type: 'thought', message: data.chunk.content };
        }
      } else if (type === 'on_tool_start' && name !== 'agent') {
        yield { type: 'status', message: `Executing tool: ${name}...` };
      } else if (type === 'on_tool_end' && name !== 'agent') {
        yield { type: 'tool_result', name: name, content: outputState.content };
      }
    }

    // Final state flush
    yield { type: 'done', content: outputState.content, todoList: outputState.todoList };
  }

  // Fallback for non-streaming usage if needed by other parts of the system
  async _onExecute(input) {
    let finalOutputState = { content: '', todoList: [] };
    const stream = this._onStreamExecute(input);
    for await (const chunk of stream) {
      if (chunk.type === 'done') {
        finalOutputState.content = chunk.content;
        finalOutputState.todoList = chunk.todoList;
      }
    }
    return finalOutputState;
  }
}

export default AppBuilderAgent;
