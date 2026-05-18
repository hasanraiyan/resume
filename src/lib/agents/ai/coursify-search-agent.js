import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { HumanMessage } from '@langchain/core/messages';
import { EventType } from '@ag-ui/core';
import BaseAgent from '../BaseAgent';
import { AGENT_IDS, getAgentTools } from '@/lib/constants/agents';
import managedToolProvider from '../utils/ManagedToolProvider';
import { COURSIFY_MARKDOWN_FORMAT } from './coursify-prompts';

const SYSTEM_PROMPT =
  `
You are a Coursify AI Course Content Generator. Your job is to research a topic using web search and then generate a reponse to user query in the Coursify markdown format.

## Response Generation Process (MANDATORY)
1. START your response with a clear, academic # Title header.
2. SEARCH the web 2-4 times using different specific queries with the **tavily_search** tool. Use different queries each time for broad coverage.
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
    const { topic } = input;

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

    const systemPrompt = SYSTEM_PROMPT;

    const contentMessages = [
      new HumanMessage({ role: 'system', content: systemPrompt }),
      new HumanMessage({
        content: `Research and generate a comprehensive Coursify course section on: "${topic}"\n\nSearch for detailed information first, then write the full Coursify markdown content.`,
      }),
    ];

    const contentAgent = createReactAgent({ llm, tools });

    // Per-stream state
    let messageId = null;
    let titleExtracted = false;
    let fullContent = '';
    const activeToolCalls = new Map(); // run_id → toolCallId

    try {
      const stream = await contentAgent.streamEvents(
        { messages: contentMessages },
        { version: 'v2', runName: `Research: ${topic.substring(0, 30)}` }
      );

      for await (const event of stream) {
        const { event: type, data, name, run_id } = event;

        if (type === 'on_chat_model_start') {
          // Begin a new assistant message for this LLM turn
          messageId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
          yield { type: EventType.TEXT_MESSAGE_START, messageId, role: 'assistant' };
        } else if (type === 'on_chat_model_stream') {
          const raw = data.chunk?.content || data.chunk?.text || '';
          if (raw && name !== 'ChatPromptTemplate') {
            const delta = typeof raw === 'string' ? raw : JSON.stringify(raw);
            fullContent += delta;

            // Emit title once the # header appears in the accumulated content
            if (!titleExtracted) {
              const m = fullContent.match(/^#\s+(.+)$/m);
              if (m) {
                yield {
                  type: EventType.CUSTOM,
                  name: 'coursify_title',
                  value: { text: m[1].trim() },
                };
                titleExtracted = true;
              }
            }

            yield { type: EventType.TEXT_MESSAGE_CONTENT, messageId, delta };
          }
        } else if (type === 'on_chat_model_end') {
          if (messageId) {
            yield { type: EventType.TEXT_MESSAGE_END, messageId };
            messageId = null;
          }

          // Emit token usage as a CUSTOM event
          const usage =
            data.output?.usage_metadata ||
            data.output?.usage ||
            data.output?.response_metadata?.tokenUsage ||
            data.output?.response_metadata?.usage;

          if (usage) {
            yield {
              type: EventType.CUSTOM,
              name: 'coursify_usage',
              value: {
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
        } else if (type === 'on_tool_start') {
          const toolCallId = `tc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
          activeToolCalls.set(run_id || name, toolCallId);
          yield { type: EventType.TOOL_CALL_START, toolCallId, toolCallName: name };
          if (data.input) {
            yield {
              type: EventType.TOOL_CALL_ARGS,
              toolCallId,
              delta: JSON.stringify(data.input),
            };
          }
        } else if (type === 'on_tool_end') {
          const toolCallId = activeToolCalls.get(run_id || name);
          if (toolCallId) {
            yield { type: EventType.TOOL_CALL_END, toolCallId };

            // TOOL_CALL_RESULT: send structured display payload
            const output = data.output;
            if (output != null) {
              let resultPayload;
              try {
                const obj = typeof output === 'object' ? output : JSON.parse(output);
                if (Array.isArray(obj.results)) {
                  resultPayload = JSON.stringify({
                    urls: obj.results.map((r) => r.url).filter(Boolean),
                  });
                } else if (typeof obj.output === 'string') {
                  // YouTube: { output: "[{videoId, thumbnail, ...}]" }
                  const videos = JSON.parse(obj.output);
                  resultPayload = JSON.stringify({
                    thumbnails: videos.map((v) => ({ thumbnail: v.thumbnail, title: v.title })),
                  });
                } else {
                  resultPayload = JSON.stringify(obj).substring(0, 1500);
                }
              } catch {
                resultPayload = String(output).substring(0, 1500);
              }
              yield { type: EventType.TOOL_CALL_RESULT, toolCallId, result: resultPayload };
            }

            activeToolCalls.delete(run_id || name);
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
