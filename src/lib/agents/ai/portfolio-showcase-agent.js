/**
 * Portfolio Showcase Agent
 *
 * Powers the full-screen AI portfolio takeover experience. Same LangGraph ReAct +
 * NDJSON streaming pattern as ChatAgent (chat-assistant-agent.js), plus one extra
 * event type: after a tool call resolves, matching tool results are translated into
 * `ui_block` events so the frontend can render generative UI widgets (project
 * carousel, skills grid, milestone timeline, etc.) inline with the chat response.
 */

import { AGENT_IDS } from '@/lib/constants/agents';
import BaseAgent from '../BaseAgent';
import { buildDynamicContext } from '../utils/context-builder';
import Analytics from '@/models/Analytics';
import ChatLog from '@/models/ChatLog';
import {
  portfolioShowcaseTools,
  getPortfolioToolStatusMessage,
  buildPortfolioUiBlocks,
} from '../utils/portfolio-showcase-tools';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { AIMessage, HumanMessage, SystemMessage, ToolMessage } from '@langchain/core/messages';

export function buildPortfolioSystemMessage(context, path, persona) {
  const { coreIdentity, aboutSummary } = context || {};
  const name = coreIdentity?.name || 'the portfolio owner';
  const role = coreIdentity?.role || '';

  return {
    role: 'system',
    content: `${persona || `You are ${name}'s AI guide.`}

IDENTITY: You represent ${name}${role ? `, ${role}` : ''}.
${coreIdentity?.introduction ? `INTRODUCTION: ${coreIdentity.introduction}` : ''}
${aboutSummary ? `ABOUT: ${aboutSummary}` : ''}

CRITICAL INSTRUCTIONS:
1. Do not make up projects, skills, or achievements. Always call a tool before making factual claims.
2. When a tool call succeeds, the frontend automatically renders a rich visual card below your message — so keep your own reply short (1-3 sentences) and conversational, don't re-list the data the card already shows.
3. If the user asks who you are, to introduce yourself, to tell them about yourself, or about the person behind this portfolio, ALWAYS call get_profile first — never answer from memory.
4. Only call submit_contact_form once you have collected the visitor's name, email, project type, and message.
5. Be warm, confident, and helpful — you're speaking on ${name}'s behalf to a visitor exploring this full-screen assistant.

PAGE CONTEXT: The user is on "${path || '/'}".`,
  };
}

class PortfolioShowcaseAgent extends BaseAgent {
  constructor(agentId = AGENT_IDS.PORTFOLIO_SHOWCASE, config = {}) {
    super(agentId, config);
  }

  async _onInitialize() {
    this.logger.info('Portfolio Showcase Agent initialized');
  }

  async _validateInput(input) {
    if (!input || !input.userMessage) {
      throw new Error('userMessage is required for Portfolio Showcase Agent');
    }
  }

  async *_onStreamExecute(input) {
    const { userMessage, chatHistory = [], sessionId, path = '/' } = input;

    const startTime = Date.now();
    let toolsUsed = [];
    let assistantContent = '';

    const actualModel = {
      providerId: this.config.providerId,
      model: this.config.model,
    };

    try {
      let context;
      try {
        context = await buildDynamicContext();
      } catch {
        throw new Error('Failed to build dynamic context.');
      }

      const llm = await this.createChatModel();

      const systemMessage = buildPortfolioSystemMessage(context, path, this.config.persona);

      const filteredHistory = chatHistory.filter((msg) => msg && msg.role);
      const messages = [
        new SystemMessage({ content: systemMessage.content }),
        ...filteredHistory.map((msg) => {
          if (msg.role === 'user') return new HumanMessage({ content: msg.content || '' });
          if (msg.role === 'assistant') {
            const params = { content: msg.content || '' };
            if (msg.tool_calls && Array.isArray(msg.tool_calls)) {
              params.tool_calls = msg.tool_calls.map((tc) => {
                let parsedArgs = {};
                try {
                  parsedArgs =
                    typeof tc.function.arguments === 'string'
                      ? JSON.parse(tc.function.arguments)
                      : tc.function.arguments;
                } catch (e) {
                  this.logger.error('Failed to parse tool arguments in chat history:', e);
                }
                return {
                  id: tc.id || `unknown-id-${Math.random()}`,
                  name: tc.function.name || 'unknown_function',
                  args: parsedArgs,
                };
              });
            }
            return new AIMessage(params);
          }
          if (msg.role === 'tool') {
            return new ToolMessage({
              content:
                typeof msg.content === 'string'
                  ? msg.content
                  : JSON.stringify(msg.content) || 'No content',
              name: msg.name || 'unknown',
              tool_call_id: msg.tool_call_id || 'unknown-id',
            });
          }
          return new SystemMessage({ content: msg.content || '' });
        }),
        new HumanMessage({ content: userMessage }),
      ];

      const finalTools =
        this.config.provider?.supportsTools !== false ? portfolioShowcaseTools : [];

      const agent = createReactAgent({ llm, tools: finalTools });

      const eventStream = await agent.streamEvents({ messages }, { version: 'v2' });

      for await (const event of eventStream) {
        const { event: type, data, name } = event;

        if (type === 'on_chat_model_stream') {
          const text = data.chunk?.text;
          if (text) {
            assistantContent += text;
            yield { type: 'content', message: text };
          }
        } else if (type === 'on_tool_start' && name !== 'agent') {
          yield { type: 'status', message: getPortfolioToolStatusMessage(name) };
        } else if (type === 'on_tool_end' && name !== 'agent') {
          const output = data.output;
          // LangGraph's on_tool_end wraps the tool's actual return value in a
          // ToolMessage instance — the real JSON string our tools returned lives
          // on `.content`, not on the wrapper object itself.
          const toolContent =
            typeof output === 'string' ? output : (output?.content ?? JSON.stringify(output));
          // The ToolMessage's own tool_call_id is what the originating AIMessage
          // declared — event.run_id is an unrelated LangSmith run id and must not
          // be used here, or history replay on the next turn fails to resolve it.
          const toolCallId = output?.tool_call_id || event.run_id;

          yield {
            type: 'tool_result',
            tool_call_id: toolCallId,
            name,
            content: toolContent,
          };
          toolsUsed.push({ name, arguments: data.input, result: output, iteration: 1 });

          let parsedOutput;
          try {
            parsedOutput = typeof toolContent === 'string' ? JSON.parse(toolContent) : toolContent;
          } catch {
            parsedOutput = null;
          }

          const blocks = buildPortfolioUiBlocks(name, parsedOutput);
          for (const block of blocks) {
            yield { type: 'ui_block', tool_call_id: toolCallId, block };
          }
        } else if (type === 'on_chat_model_end') {
          const aiMessage = data.output;
          if (aiMessage?.tool_calls?.length > 0) {
            const formattedCalls = aiMessage.tool_calls.map((tc) => ({
              id: tc.id,
              type: 'function',
              function: { name: tc.name, arguments: JSON.stringify(tc.args) },
            }));
            yield { type: 'metadata', tool_calls: formattedCalls };
          }
        }
      }
    } catch (error) {
      this.logger.error('Portfolio Showcase stream execution error:', error);
      throw error;
    }

    if (assistantContent?.trim()) {
      new Analytics({
        eventType: 'portfolio_showcase_interaction',
        path,
        sessionId,
        properties: { userQuestion: userMessage, toolsCount: toolsUsed.length, toolsUsed },
      })
        .save()
        .catch((e) => this.logger.error('Failed to save Analytics:', e));

      new ChatLog({
        sessionId,
        path,
        userMessage,
        aiResponse: assistantContent,
        modelName: actualModel.model || 'unknown',
        conversationContext: [{ role: 'system', content: 'Context truncated for logs' }],
        toolsUsed,
        executionTime: Date.now() - startTime,
      })
        .save()
        .catch((e) => this.logger.error('Failed to save ChatLog:', e));
    }
  }

  async _onExecute() {
    throw new Error('PortfolioShowcaseAgent only supports streamExecute');
  }
}

export default PortfolioShowcaseAgent;
