import { RunnableLambda } from '@langchain/core/runnables';
import { HumanMessage } from '@langchain/core/messages';
import { AgentExecutor, createReactAgent } from '@langchain/classic/agents';
import { EventType } from '@ag-ui/core';
import BaseAgent from '../BaseAgent';
import { AGENT_IDS, getAgentTools } from '@/lib/constants/agents';
import managedToolProvider from '../utils/ManagedToolProvider';
import { COURSIFY_MARKDOWN_FORMAT } from './coursify-prompts';

/**
 * Custom Safe React Prompt Formatter
 * Avoids standard PromptTemplate parser curly brace '{' escaping issues
 * by doing exact string replacements only for the required keys.
 */
class CustomSafeReactPrompt {
  constructor(templateString) {
    this.templateString = templateString;
    this.inputVariables = ['tools', 'tool_names', 'agent_scratchpad', 'input'];
  }

  async partial(values) {
    let partiallyFormatted = this.templateString;
    if (values.tools !== undefined) {
      partiallyFormatted = partiallyFormatted.replace('{tools}', values.tools);
    }
    if (values.tool_names !== undefined) {
      partiallyFormatted = partiallyFormatted.replace('{tool_names}', values.tool_names);
    }

    const runnable = RunnableLambda.from(async (inputs) => {
      let finalPrompt = partiallyFormatted;
      if (inputs.input !== undefined) {
        finalPrompt = finalPrompt.replace('{input}', inputs.input);
      }
      if (inputs.agent_scratchpad !== undefined) {
        finalPrompt = finalPrompt.replace('{agent_scratchpad}', inputs.agent_scratchpad);
      }
      return [new HumanMessage({ content: finalPrompt })];
    });

    runnable.inputVariables = ['input', 'agent_scratchpad'];
    return runnable;
  }
}

const SYSTEM_PROMPT =
  `You are a Coursify AI Course Content Generator. Your job is to research a topic using web search and video search tools, then generate a response in the strict Coursify markdown block format.

You have access to the following tools:

{tools}

Use the following format:

Question: the input question you must answer
Thought: you should always think about what to do
Action: the action to take, should be one of [{tool_names}]
Action Input: the input to the action
Observation: the result of the action
... (this Thought/Action/Action Input/Observation can repeat N times)
Thought: I now know the final answer
Final Answer: the final answer to the original input question

## Response Generation Process (MANDATORY)
1. START your response with a clear, academic # Title header.
2. SEARCH the web using Tavily or YouTube search 2-4 times with specific, distinct queries to gather sufficient context and video content before compiling the results.
3. OUTPUT the full Coursify markdown content inside the "Final Answer" section. Do NOT ask questions.

` + COURSIFY_MARKDOWN_FORMAT;

const REACT_PROMPT = new CustomSafeReactPrompt(
  SYSTEM_PROMPT + `\n\nBegin!\n\nQuestion: {input}\nThought: {agent_scratchpad}`
);

class CoursifyResearchAgent extends BaseAgent {
  constructor(agentId = AGENT_IDS.COURSIFY_RESEARCH, config = {}) {
    super(agentId, config);
  }

  async _onInitialize() {
    this.logger.info('Coursify Research Agent (classic) initialized');
  }

  async _validateInput(input) {
    if (!input?.topic) throw new Error('topic is required');
    const topic = input.topic.trim();
    if (!topic) throw new Error('topic is required');
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

  async *_onStreamExecute(input) {
    const { topic } = input;
    const topicPreview = topic.substring(0, 50);
    this.logger.info(`Starting CoursifyResearchAgent (classic) for topic: "${topicPreview}..."`);

    // const llm = await this.createChatModel();

    const { ChatOpenAI } = await import('@langchain/openai');
    const llm = new ChatOpenAI({
      modelName: 'antigravity-gemini-3-flash',
      apiKey: 'local-dummy-key',
      configuration: { baseURL: 'http://localhost:3001/v1' },
    });
    this.logger.debug('Chat model created');

    let enabledToolIds = this.config.tools || [];
    if (enabledToolIds.length === 0) {
      enabledToolIds = getAgentTools(this.agentId);
      this.logger.debug(`Using default tools from constants: ${enabledToolIds.join(', ')}`);
    }

    const tools = await managedToolProvider.getTools(enabledToolIds, this.logger);
    this.logger.debug(`ReAct agent tools loaded: ${tools.map((t) => t.name).join(', ')}`);

    const agent = await createReactAgent({
      llm,
      tools,
      prompt: REACT_PROMPT,
    });

    const executor = new AgentExecutor({
      agent,
      tools,
      handleParsingErrors: true,
      maxIterations: 10,
    });

    // Per-stream state
    let messageId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    let reasoningId = `reasoning-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    let titleExtracted = false;
    let fullContent = '';
    let streamBuffer = '';
    let currentMode = 'thought'; // 'thought' | 'answer'
    let reasoningStarted = false;
    let messageStarted = false;
    const activeToolCalls = new Map(); // run_id → toolCallId

    try {
      const stream = await executor.streamEvents(
        { input: topic },
        { version: 'v2', runName: `Research (Classic): ${topic.substring(0, 30)}` }
      );

      for await (const event of stream) {
        const { event: type, data, name, run_id } = event;

        if (type === 'on_chat_model_stream') {
          const raw = data.chunk?.content || data.chunk?.text || '';
          if (raw && name !== 'ChatPromptTemplate') {
            const delta = typeof raw === 'string' ? raw : JSON.stringify(raw);
            streamBuffer += delta;

            if (currentMode === 'thought') {
              const finalAnswerIndex = streamBuffer.toLowerCase().indexOf('final answer:');
              if (finalAnswerIndex !== -1) {
                // Thought ended, transition to answer
                const thoughtPart = streamBuffer.substring(0, finalAnswerIndex);
                const cleanedThought = thoughtPart.replace(/^\s*Thought:\s*/i, '').trim();

                if (cleanedThought && reasoningStarted) {
                  yield {
                    type: EventType.REASONING_MESSAGE_CONTENT,
                    messageId: reasoningId,
                    delta: cleanedThought,
                  };
                }

                if (reasoningStarted) {
                  yield { type: EventType.REASONING_MESSAGE_END, messageId: reasoningId };
                  yield { type: EventType.REASONING_END };
                  reasoningStarted = false;
                }

                currentMode = 'answer';
                const answerContent = streamBuffer.substring(
                  finalAnswerIndex + 'final answer:'.length
                );

                if (!messageStarted) {
                  yield { type: EventType.TEXT_MESSAGE_START, messageId, role: 'assistant' };
                  messageStarted = true;
                }

                if (answerContent) {
                  const cleanedAnswer = answerContent.replace(/^\s*/, '');
                  fullContent += cleanedAnswer;
                  yield {
                    type: EventType.TEXT_MESSAGE_CONTENT,
                    messageId,
                    delta: cleanedAnswer,
                  };

                  // Check if title is extracted
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
              } else {
                // Still in thought mode
                if (!reasoningStarted) {
                  yield { type: EventType.REASONING_START };
                  yield {
                    type: EventType.REASONING_MESSAGE_START,
                    messageId: reasoningId,
                    role: 'assistant',
                  };
                  reasoningStarted = true;
                }
                const cleanedDelta = delta.replace(/^\s*Thought:\s*/i, '');
                if (cleanedDelta) {
                  yield {
                    type: EventType.REASONING_MESSAGE_CONTENT,
                    messageId: reasoningId,
                    delta: cleanedDelta,
                  };
                }
              }
            } else {
              // Answer mode
              fullContent += delta;
              yield { type: EventType.TEXT_MESSAGE_CONTENT, messageId, delta };

              // Check if title is extracted
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
              delta: typeof data.input === 'string' ? data.input : JSON.stringify(data.input),
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

      // Cleanup after stream finishes
      if (currentMode === 'thought' && reasoningStarted) {
        yield { type: EventType.REASONING_MESSAGE_END, messageId: reasoningId };
        yield { type: EventType.REASONING_END };
        reasoningStarted = false;

        // If no message was ever started, let's treat the entire reasoning as the final response
        if (!messageStarted) {
          const cleanedText = streamBuffer.replace(/^\s*Thought:\s*/i, '').trim();
          if (cleanedText) {
            yield { type: EventType.TEXT_MESSAGE_START, messageId, role: 'assistant' };
            messageStarted = true;
            yield { type: EventType.TEXT_MESSAGE_CONTENT, messageId, delta: cleanedText };
          }
        }
      }

      if (messageStarted) {
        yield { type: EventType.TEXT_MESSAGE_END, messageId };
      }
    } catch (err) {
      this.logger.error(`Agent execution failed: ${err.message}`);
      throw err;
    }
  }

  async _onExecute() {
    throw new Error('CoursifyResearchAgent only supports streamExecute');
  }
}

export default CoursifyResearchAgent;
