import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { HumanMessage } from '@langchain/core/messages';
import { PromptTemplate } from '@langchain/core/prompts';
import BaseAgent from '../BaseAgent';
import { AGENT_IDS, getAgentTools } from '@/lib/constants/agents';
import managedToolProvider from '../utils/ManagedToolProvider';
import { COURSIFY_MARKDOWN_FORMAT, REFERENCE_ADDENDUM } from './coursify-prompts';

const SYSTEM_PROMPT_TEMPLATE =
  `
You are a Coursify AI Course Content Generator. Your job is to research a topic using web search and then generate a reponse to user query in the Coursify markdown format.

## Response Generation Process (MANDATORY)
1. START your response with a clear, academic # Title header.
2. SEARCH the web 2-4 times using different specific queries with the **{SEARCH_TOOL}** tool. Use different queries each time for broad coverage.
3. After gathering info, OUTPUT the full Coursify markdown content. Do NOT ask questions.
` + COURSIFY_MARKDOWN_FORMAT;

const SEARCH_TOOL = 'tavily_search';

class CoursifySearchAgent extends BaseAgent {
  constructor(agentId = AGENT_IDS.COURSIFY_SEARCH, config = {}) {
    super(agentId, config);
  }

  async _onInitialize() {
    this.logger.info('Coursify Search Agent initialized');
  }

  async _validateInput(input) {
    if (!input?.topic) throw new Error('topic is required');
  }

  async *_onStreamExecute(input) {
    const { topic, isReferenceEnabled } = input;

    const topicPreview = topic.substring(0, 50);
    this.logger.info(`Starting CoursifySearchAgent for topic: "${topicPreview}..."`);

    const llm = await this.createChatModel();
    this.logger.debug('Chat model created');

    // Load tools, exclude firecrawl_scrape
    let enabledToolIds = this.config.tools || [];
    if (enabledToolIds.length === 0) {
      enabledToolIds = getAgentTools(this.agentId);
      this.logger.debug(`Using default tools from constants: ${enabledToolIds.join(', ')}`);
    }

    const allTools = await managedToolProvider.getTools(enabledToolIds, this.logger);
    const tools = allTools.filter((t) => t.name !== 'firecrawl_scrape');

    this.logger.debug(`ReAct agent created with ${tools.length} tools`);
    tools.forEach((tool, idx) => {
      const toolName = tool.name || tool.lc_id?.[tool.lc_id.length - 1] || 'unknown';
      this.logger.debug(`  Tool ${idx + 1}: ${toolName}`);
    });

    // Build prompt from template
    const promptTemplate = PromptTemplate.fromTemplate(SYSTEM_PROMPT_TEMPLATE);
    let systemPrompt = await promptTemplate.format({ SEARCH_TOOL });

    if (isReferenceEnabled) {
      systemPrompt += REFERENCE_ADDENDUM;
    }

    const contentMessages = [
      new HumanMessage({ role: 'system', content: systemPrompt }),
      new HumanMessage({
        content: `Research and generate a comprehensive Coursify course section on: "${topic}"\n\nSearch for detailed information first, then write the full Coursify markdown content.`,
      }),
    ];

    const contentAgent = createReactAgent({
      llm,
      tools,
    });

    try {
      const stream = await contentAgent.streamEvents(
        { messages: contentMessages },
        { version: 'v2', runName: `Research: ${topic.substring(0, 30)}` }
      );

      for await (const event of stream) {
        const { event: type, data, name } = event;

        const content = data.chunk?.content || data.chunk?.text || '';

        if (type === 'on_chat_model_stream' && content && name !== 'ChatPromptTemplate') {
          const message = typeof content === 'string' ? content : JSON.stringify(content);
          yield { type: 'content', message };
        } else if (type === 'on_tool_start') {
          yield {
            type: 'tool_call',
            tool: name,
            status: 'started',
            input: data.input,
          };
        } else if (type === 'on_tool_end') {
          yield {
            type: 'tool_call',
            tool: name,
            status: 'completed',
            output: data.output,
          };
          yield {
            type: 'tool_result',
            name: name,
            input: data.input,
            output: data.output,
          };
        } else if (type === 'on_chat_model_start') {
          yield { type: 'status', message: '' };
        } else if (type === 'on_chat_model_end') {
          const usage =
            data.output?.usage_metadata ||
            data.output?.usage ||
            data.output?.response_metadata?.tokenUsage ||
            data.output?.response_metadata?.usage;

          if (usage) {
            yield {
              type: 'usage',
              data: {
                promptTokens:
                  usage.prompt_tokens || usage.promptTokens || usage.promptTokenCount || 0,
                completionTokens:
                  usage.completion_tokens ||
                  usage.completionTokens ||
                  usage.candidatesTokenCount ||
                  0,
                totalTokens: usage.total_tokens || usage.totalTokens || usage.totalTokenCount || 0,
              },
            };
          }
        }
      }
    } catch (err) {
      this.logger.error(`Agent execution failed: ${err.message}`);
      throw err;
    }
  }

  async _onExecute() {
    throw new Error('CoursifySearchAgent only supports streamExecute');
  }
}

export default CoursifySearchAgent;
