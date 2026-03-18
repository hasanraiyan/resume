/**
 * App Builder Agent
 *
 * Generates standalone HTML/JS/Tailwind web applications using LangGraph state.
 * Extends BaseAgent.
 */

import { AGENT_IDS } from '@/lib/constants/agents';
import BaseAgent from '../BaseAgent';
import { StateGraph, END, START } from '@langchain/langgraph';
import { Annotation } from '@langchain/langgraph';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import { z } from 'zod';

// Define the state schema for the app builder workflow
const AppBuilderState = Annotation.Root({
  name: Annotation({ reducer: (state, update) => update, default: () => '' }),
  description: Annotation({ reducer: (state, update) => update, default: () => '' }),
  designSchema: Annotation({ reducer: (state, update) => update, default: () => 'modern' }),
  todoList: Annotation({ reducer: (state, update) => update, default: () => [] }),
  htmlContent: Annotation({ reducer: (state, update) => update, default: () => '' }),
  error: Annotation({ reducer: (state, update) => update, default: () => null }),
});

class AppBuilderAgent extends BaseAgent {
  constructor(agentId = AGENT_IDS.APP_BUILDER, config = {}) {
    super(agentId, config);
    this._graph = null;
  }

  async _onInitialize() {
    this.logger.info('App Builder Agent Initialized (LangGraph)');
  }

  async _buildGraph() {
    const self = this;

    // Node 1: Plan the app
    const planNode = async (state) => {
      self.logger.info(`Planning app: ${state.name} with schema: ${state.designSchema}`);
      const model = await self.createChatModel({ temperature: 0.2 }).then((m) =>
        m.withStructuredOutput(
          z.object({
            todoList: z
              .array(z.string())
              .describe('List of structural and functional steps needed to build this app.'),
          })
        )
      );

      const systemMsg = new SystemMessage(
        `You are an expert Frontend Architect. Plan out the steps to build a single-file HTML/JS/Tailwind CSS web app.
App Name: ${state.name}
Description: ${state.description}
Design Schema: ${state.designSchema}`
      );

      const response = await model.invoke([systemMsg]);

      return { todoList: response.todoList };
    };

    // Node 2: Generate HTML code
    const generateNode = async (state) => {
      self.logger.info(`Generating HTML for app: ${state.name}`);
      const model = await self.createChatModel({ temperature: 0.7 });

      const systemMsg = new SystemMessage(
        `You are an elite Frontend Developer. Your task is to generate the complete, single-file HTML content for a web app based on the provided plan.
REQUIREMENTS:
1. MUST use Tailwind CSS via CDN (<script src="https://cdn.tailwindcss.com"></script>).
2. MUST include any required icons (e.g., FontAwesome or unpkg Lucide) or libraries (e.g., React/Babel via CDN if necessary, or vanilla JS).
3. Vanilla JS is preferred for simplicity unless complex state requires React/Vue.
4. MUST be a complete HTML document starting with <!DOCTYPE html>.
5. MUST NOT include any markdown formatting (like \`\`\`html). Output strictly the HTML string.
6. Design Schema requested: ${state.designSchema}. Make sure the UI reflects this style (e.g. minimalist, playful, dashboard).

App Name: ${state.name}
Description: ${state.description}
Plan:
${state.todoList.map((item, i) => `${i + 1}. ${item}`).join('\n')}

Output ONLY the raw HTML code.`
      );

      const response = await model.invoke([systemMsg]);
      let html = response.content.trim();

      // Cleanup markdown artifacts if any
      if (html.startsWith('```html')) {
        html = html.replace(/^```html\n?/, '').replace(/\n?```$/, '');
      } else if (html.startsWith('```')) {
        html = html.replace(/^```\n?/, '').replace(/\n?```$/, '');
      }

      return { htmlContent: html };
    };

    // Node 3: Review Code
    const reviewNode = async (state) => {
      self.logger.info(`Reviewing generated HTML for app: ${state.name}`);
      // Simple automated review
      let error = null;
      let html = state.htmlContent;

      if (!html.includes('<html') || !html.includes('</html>')) {
        self.logger.warn('HTML output seems incomplete, missing <html> tags.');
        error = 'Generated output is not a valid HTML document.';
      }

      return { error };
    };

    const graph = new StateGraph(AppBuilderState)
      .addNode('plan', planNode)
      .addNode('generate', generateNode)
      .addNode('review', reviewNode)
      .addEdge(START, 'plan')
      .addEdge('plan', 'generate')
      .addEdge('generate', 'review')
      .addEdge('review', END);

    return graph.compile();
  }

  async _validateInput(input) {
    if (!input || !input.name || !input.description) {
      throw new Error('name and description are required for the App Builder Agent');
    }
  }

  async _onExecute(input) {
    const { name, description, designSchema = 'modern' } = input;

    if (!this._graph) {
      this._graph = await this._buildGraph();
    }

    const result = await this._graph.invoke({
      name,
      description,
      designSchema,
    });

    if (result.error) {
      throw new Error(result.error);
    }

    return {
      content: result.htmlContent,
      todoList: result.todoList,
    };
  }
}

export default AppBuilderAgent;
