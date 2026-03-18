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
        return `Plan saved successfully. Now proceed to generate the HTML using the save_code tool.`;
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

    const saveCodeTool = tool(
      async (input) => {
        this.logger.info(`Saving code... length: ${input.htmlContent.length}`);

        let html = input.htmlContent.trim();
        // Cleanup markdown artifacts if any
        if (html.startsWith('```html')) {
          html = html.replace(/^```html\n?/, '').replace(/\n?```$/, '');
        } else if (html.startsWith('```')) {
          html = html.replace(/^```\n?/, '').replace(/\n?```$/, '');
        }

        outputState.content = html;
        return `Code saved successfully. You may now complete your execution.`;
      },
      {
        name: 'save_code',
        description:
          'Saves the complete, single-file HTML/JS/CSS application. Call this AFTER saving the plan.',
        schema: z.object({
          htmlContent: z.string().describe('The complete raw HTML string for the web app.'),
        }),
      }
    );

    return [savePlanTool, saveCodeTool];
  }

  _getSystemPrompt(input) {
    return `You are an elite App Builder agent. Your job is to generate complete, single-file HTML/JS/CSS applications.

App Name: ${input.name}
Description: ${input.description}
Design Schema: ${input.designSchema || 'modern'}

REQUIREMENTS:
1. You MUST first call the \`save_plan\` tool to outline the architecture and steps.
2. After saving the plan, you MUST call the \`save_code\` tool to provide the final HTML.
3. The HTML MUST use Tailwind CSS via CDN (<script src="https://cdn.tailwindcss.com"></script>).
4. MUST include any required icons (e.g., FontAwesome or unpkg Lucide) or libraries (e.g., React/Babel via CDN if necessary, or vanilla JS).
5. Vanilla JS is preferred for simplicity unless complex state requires React/Vue.
6. MUST be a complete HTML document starting with <!DOCTYPE html>.
7. Make sure the UI reflects the requested Design Schema (e.g. minimalist, playful, dashboard).
`;
  }

  async _onExecute(input) {
    const outputState = { content: '', todoList: [] };
    const tools = this._getTools(outputState);
    const model = await this.createChatModel({ temperature: 0.7 });

    const agent = createReactAgent({
      llm: model,
      tools,
      messageModifier: this._getSystemPrompt(input),
    });

    const result = await agent.invoke({
      messages: [{ role: 'user', content: `Please build the ${input.name} app.` }],
    });

    // Fallback if the agent didn't use the save_code tool properly but still returned HTML
    if (!outputState.content) {
      const lastMsg = result.messages[result.messages.length - 1];
      if (lastMsg && typeof lastMsg.content === 'string' && lastMsg.content.includes('<html')) {
        let html = lastMsg.content.trim();
        if (html.startsWith('```html')) {
          html = html.replace(/^```html\n?/, '').replace(/\n?```$/, '');
        } else if (html.startsWith('```')) {
          html = html.replace(/^```\n?/, '').replace(/\n?```$/, '');
        }
        outputState.content = html;
      } else {
        throw new Error('Agent failed to generate HTML code.');
      }
    }

    return outputState;
  }
}

export default AppBuilderAgent;
