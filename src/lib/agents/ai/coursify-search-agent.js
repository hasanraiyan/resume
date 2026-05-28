import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { HumanMessage } from '@langchain/core/messages';
import { EventType } from '@ag-ui/core';
import { Filter } from 'bad-words';
import BaseAgent from '../BaseAgent';
import { AGENT_IDS, getAgentTools } from '@/lib/constants/agents';
import managedToolProvider from '../utils/ManagedToolProvider';
import { COURSIFY_MARKDOWN_FORMAT } from './coursify-prompts';

// ============================================
// JSDoc Types (for .js file compatibility)
// ============================================

/**
 * Final result returned by the non-streaming `_onExecute()` path.
 *
 * @typedef {Object} CoursifySearchResult
 * @property {string} title - Extracted academic title from the generated content (first `# ` heading)
 * @property {string} content - Complete Coursify-formatted markdown (with [MdBlock], [QuizBlock], etc.)
 * @property {Object} usage - Token usage aggregated across the entire research run
 * @property {number} usage.promptTokens
 * @property {number} usage.completionTokens
 * @property {number} usage.totalTokens
 * @property {Object} [metadata]
 * @property {number} [metadata.durationMs] - Total time taken for the research run (ms)
 */

// ============================================
// Constants
// ============================================

const SYSTEM_PROMPT =
  `
You are a Coursify AI Course Content Generator. Your job is to research a topic using web search and then generate a reponse to user query in the Coursify markdown format.

## Response Generation Process (MANDATORY)
1. START your response with a clear, academic # Title header.
2. SEARCH the web 2-4 times using different specific queries with the **tavily_search** tool. Use different queries each time for broad coverage.
3. After gathering info, OUTPUT the full Coursify markdown content. Do NOT ask questions.
` + COURSIFY_MARKDOWN_FORMAT;

const SEARCH_TOOL = 'tavily_search';

const contentFilter = new Filter();

/**
 * Coursify Search Agent
 *
 * A ReAct-based research agent that uses web search (primarily Tavily)
 * to gather information and then generates content in the strict
 * Coursify markdown block format.
 *
 * Features:
 * - Streaming-first design (primary path)
 * - Non-streaming `_onExecute()` support (for internal use)
 * - Early title extraction during streaming
 * - Detailed tool lifecycle events for UI progress
 *
 * Used in production for `/api/coursify/generate` and `/api/coursify/generate-section`.
 */
class CoursifySearchAgent extends BaseAgent {
  /**
   * @param {string} [agentId]
   * @param {Object} [config]
   */
  constructor(agentId = AGENT_IDS.COURSIFY_SEARCH_FLASH, config = {}) {
    super(agentId, config);
  }

  /**
   * Called once when the agent is first initialized.
   */
  async _onInitialize() {
    this.logger.info('Coursify Search Agent initialized');
  }

  /**
   * Validates that the required `topic` is present in the input.
   * Called automatically by the BaseAgent framework before execution.
   *
   * @param {Object} input
   * @param {string} input.topic - The research topic/query
   * @throws {Error} If `topic` is missing
   */
  async _validateInput(input) {
    if (!input?.topic) throw new Error('topic is required');

    const topic = input.topic.trim();
    if (!topic) throw new Error('topic is required');
  }

  // ============================================
  // Shared Helpers
  // ============================================

  /**
   * Returns the full system prompt used by this agent.
   * Extracted for reuse between streaming and non-streaming paths.
   *
   * @returns {string}
   */
  _buildSystemPrompt() {
    return SYSTEM_PROMPT;
  }

  /**
   * Loads tools for this agent and filters out
   * (this agent prefers Tavily + YouTube search).
   *
   * @returns {Promise<Array<Object>>} Array of tool instances
   */
  async _getFilteredTools() {
    let enabledToolIds = this.config.tools || [];
    if (enabledToolIds.length === 0) {
      enabledToolIds = getAgentTools(this.agentId);
      this.logger.debug(`Using default tools from constants: ${enabledToolIds.join(', ')}`);
    }

    const tools = await managedToolProvider.getTools(enabledToolIds, this.logger);

    this.logger.debug(`ReAct agent created with ${tools.length} tools`);
    tools.forEach((tool, idx) => {
      const toolName = tool.name || tool.lc_id?.[tool.lc_id.length - 1] || 'unknown';
      this.logger.debug(`  Tool ${idx + 1}: ${toolName}`);
    });

    return tools;
  }

  /**
   * Extracts and normalizes token usage from various LangChain event shapes.
   *
   * @param {Object} [output] - Raw output object from a chat model event
   * @returns {{promptTokens: number, completionTokens: number, totalTokens: number} | null}
   */
  _extractUsage(output) {
    if (!output) return null;

    const usage =
      output.usage_metadata ||
      output.usage ||
      output.response_metadata?.tokenUsage ||
      output.response_metadata?.usage;

    if (!usage) return null;

    return {
      promptTokens: usage.prompt_tokens || usage.promptTokens || usage.promptTokenCount || 0,
      completionTokens:
        usage.completion_tokens || usage.completionTokens || usage.candidatesTokenCount || 0,
      totalTokens: usage.total_tokens || usage.totalTokens || usage.totalTokenCount || 0,
    };
  }

  // ============================================
  // Execution Methods
  // ============================================

  /**
   * Streaming research execution.
   * Yields AG-UI compatible events (TEXT_MESSAGE_*, TOOL_CALL_*, CUSTOM) in real time.
   * This is the primary path used by the research UI.
   *
   * @param {Object} input
   * @param {string} input.topic - Research topic to investigate
   * @yields {Object} AG-UI style events (TEXT_MESSAGE_START/CONTENT/END, TOOL_CALL_*, CUSTOM)
   * @returns {Promise<CoursifySearchResult>} Final aggregated result (for consistency)
   */
  async *_onStreamExecute(input) {
    const { topic } = input;

    const topicPreview = topic.substring(0, 50);
    this.logger.info(`Starting CoursifySearchAgent for topic: "${topicPreview}..."`);

    // ── Content Filter ──
    if (contentFilter.isProfane(topic)) {
      yield {
        type: EventType.CUSTOM,
        name: 'coursify_rejection',
        value: { reason: 'inappropriate_content' },
      };

      const msgId = `msg-${Date.now()}`;
      yield { type: EventType.TEXT_MESSAGE_START, messageId: msgId, role: 'assistant' };
      yield {
        type: EventType.TEXT_MESSAGE_CONTENT,
        messageId: msgId,
        delta: `I cannot generate course content for this topic as it was flagged for inappropriate content. Please try a different, educational topic.`,
      };
      yield { type: EventType.TEXT_MESSAGE_END, messageId: msgId };
      yield { type: EventType.RUN_FINISHED };
      return;
    }
    // ── End Content Filter ──

    const llm = await this.createChatModel();
    this.logger.debug('Chat model created');

    const tools = await this._getFilteredTools();

    const systemPrompt = this._buildSystemPrompt();

    const contentMessages = [
      new HumanMessage({ role: 'system', content: systemPrompt }),
      new HumanMessage({
        content: `Research and generate a comprehensive Coursify course section on: "${topic}"\n\nSearch for detailed information first, then write the full Coursify markdown content.`,
      }),
    ];

    const contentAgent = createReactAgent({ llm, tools });

    // Per-stream state (must stay inside the generator)
    let messageId = null;
    let titleExtracted = false;
    let fullContent = '';
    const activeToolCalls = new Map(); // run_id → toolCallId
    let reasoningId = `reasoning-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    let reasoningStarted = false;

    try {
      const stream = await contentAgent.streamEvents(
        { messages: contentMessages },
        { version: 'v2', runName: `Research: ${topic.substring(0, 30)}` }
      );

      for await (const event of stream) {
        const { event: type, data, name, run_id } = event;

        if (type === 'on_chat_model_start') {
          messageId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
          yield { type: EventType.TEXT_MESSAGE_START, messageId, role: 'assistant' };
        } else if (type === 'on_chat_model_stream') {
          if (name !== 'ChatPromptTemplate') {
            // Extract native thought delta if any
            let thoughtDelta = '';
            const contentBlocks = data.chunk?.contentBlocks;
            if (Array.isArray(contentBlocks)) {
              for (const block of contentBlocks) {
                if (block && block.type === 'reasoning' && typeof block.reasoning === 'string') {
                  thoughtDelta += block.reasoning;
                }
              }
            } else {
              const rawContent = data.chunk?.content;
              if (Array.isArray(rawContent)) {
                for (const part of rawContent) {
                  if (
                    part &&
                    (part.type === 'reasoning' ||
                      part.type === 'thought' ||
                      part.type === 'thoughtSignature')
                  ) {
                    // Ignore thoughtSignature as requested
                    if (part.type !== 'thoughtSignature') {
                      thoughtDelta += part.reasoning || part.thought || '';
                    }
                  }
                }
              }
            }

            if (thoughtDelta) {
              if (!reasoningStarted) {
                yield { type: EventType.REASONING_START };
                yield {
                  type: EventType.REASONING_MESSAGE_START,
                  messageId: reasoningId,
                  role: 'assistant',
                };
                reasoningStarted = true;
              }
              yield {
                type: EventType.REASONING_MESSAGE_CONTENT,
                messageId: reasoningId,
                delta: thoughtDelta,
              };
            }

            const delta = data.chunk?.text || '';
            if (delta) {
              if (reasoningStarted) {
                yield { type: EventType.REASONING_MESSAGE_END, messageId: reasoningId };
                yield { type: EventType.REASONING_END };
                reasoningStarted = false;
              }
              fullContent += delta;
              yield { type: EventType.TEXT_MESSAGE_CONTENT, messageId, delta };

              // Emit title once the # header appears
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
            }
          }
        } else if (type === 'on_chat_model_end') {
          if (messageId) {
            yield { type: EventType.TEXT_MESSAGE_END, messageId };
            messageId = null;
          }

          const usage = this._extractUsage(data?.output);
          if (usage) {
            yield {
              type: EventType.CUSTOM,
              name: 'coursify_usage',
              value: usage,
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

  /**
   * Non-streaming research execution.
   * Runs the full research flow and returns the final aggregated result.
   * Useful for internal calls, testing, or non-UI consumers.
   *
   * @param {Object} input
   * @param {string} input.topic - Research topic to investigate
   * @returns {Promise<CoursifySearchResult>}
   */
  async _onExecute(input) {
    const { topic } = input;

    const topicPreview = topic.substring(0, 50);
    this.logger.info(`Starting CoursifySearchAgent (non-stream) for topic: "${topicPreview}..."`);

    if (contentFilter.isProfane(topic)) {
      throw new Error('CONTENT_REJECTED');
    }

    const llm = await this.createChatModel();
    const tools = await this._getFilteredTools();
    const systemPrompt = this._buildSystemPrompt();

    const contentMessages = [
      new HumanMessage({ role: 'system', content: systemPrompt }),
      new HumanMessage({
        content: `Research and generate a comprehensive Coursify course section on: "${topic}"\n\nSearch for detailed information first, then write the full Coursify markdown content.`,
      }),
    ];

    const contentAgent = createReactAgent({ llm, tools });

    let fullContent = '';
    let extractedTitle = '';
    const usage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
    const startTime = Date.now();

    try {
      const stream = await contentAgent.streamEvents(
        { messages: contentMessages },
        { version: 'v2', runName: `Research: ${topic.substring(0, 30)}` }
      );

      for await (const event of stream) {
        const { event: type, data } = event;

        if (type === 'on_chat_model_stream') {
          const delta = data.chunk?.text || '';
          if (delta) {
            fullContent += delta;

            // Title extraction (non-streaming version)
            if (!extractedTitle) {
              const m = fullContent.match(/^#\s+(.+)$/m);
              if (m) {
                extractedTitle = m[1].trim();
              }
            }
          }
        } else if (type === 'on_chat_model_end') {
          const turnUsage = this._extractUsage(data?.output);
          if (turnUsage) {
            usage.promptTokens += turnUsage.promptTokens;
            usage.completionTokens += turnUsage.completionTokens;
            usage.totalTokens += turnUsage.totalTokens;
          }
        }
      }
    } catch (err) {
      this.logger.error(`Agent execution failed: ${err.message}`);
      throw err;
    }

    // Final fallback title
    if (!extractedTitle) {
      const m = fullContent.match(/^#\s+(.+)$/m);
      extractedTitle = m ? m[1].trim() : topic;
    }

    const result = {
      title: extractedTitle,
      content: fullContent.trim(),
      usage,
      metadata: {
        durationMs: Date.now() - startTime,
      },
    };

    this.logger.info(`CoursifySearchAgent (non-stream) completed. Title: "${result.title}"`);
    return result;
  }
}

export default CoursifySearchAgent;
