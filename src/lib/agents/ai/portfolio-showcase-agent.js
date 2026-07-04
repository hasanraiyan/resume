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
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { mapHistoryEntryToMessages } from '../utils/history-mapping';
import { getCheckpointer } from '../utils/checkpointer';

const POST_TOOL_BREVITY_REMINDER = new SystemMessage(
  'A visual card was just rendered below for the data above. Reply in ONE short, conversational ' +
    'sentence only — no lists, no restating titles, links, dates, tags, or descriptions the card ' +
    'already shows.'
);

/**
 * Dynamic `prompt` for createReactAgent: injects a stronger brevity reminder
 * right after a tool result, since that's exactly when models are tempted to
 * narrate the data a UI card is about to render — a static system message
 * alone isn't enough to stop it.
 */
function buildPortfolioPrompt(systemContent) {
  const baseSystem = new SystemMessage(systemContent);
  return (state) => {
    const { messages } = state;
    const lastMessage = messages[messages.length - 1];
    const justRanTool = lastMessage?._getType?.() === 'tool';
    return justRanTool
      ? [baseSystem, POST_TOOL_BREVITY_REMINDER, ...messages]
      : [baseSystem, ...messages];
  };
}

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
1. You are replying to the visitor, not continuing or finishing their sentence. Never echo, extend, or restate the user's own message back to them as if it were your answer — always produce a distinct, new response in your own voice that actually addresses what they asked.
2. Do not make up projects, skills, or achievements. Always call a tool before making factual claims.
3. When a tool call succeeds, the frontend automatically renders a rich visual card below your message with the titles, images, links, and details already on it. Your own reply must be AT MOST ONE short, conversational sentence — e.g. "Here's my top project — check it out below!" Never write a list, never restate names/dates/links/descriptions the card already shows, and never describe the card itself.
4. If the user asks who you are, to introduce yourself, to tell them about yourself, or about the person behind this portfolio, ALWAYS call get_profile first — never answer from memory.
5. get_project_details and get_article_details need an exact slug, which you usually won't have yet. If the user names a project/article by title (not slug) and you don't already know its slug from earlier tool results in this conversation, call get_projects/get_articles or search_portfolio FIRST to resolve the slug, THEN call get_project_details/get_article_details. Never skip straight to a guessed slug, and never respond with silence or an empty message — if you can't resolve something, say so in plain text.
6. If the user asks to see, view, or download the resume/CV, call get_resume — don't assume it's already shown just because you called get_profile earlier.
7. Only call submit_contact_form once you have collected the visitor's name, email, project type, and message.
8. Be warm, confident, and helpful — you're speaking on ${name}'s behalf to a visitor exploring this full-screen assistant.

PAGE CONTEXT: The user is on "${path || '/'}".`,
  };
}

/**
 * Suggests 2-3 short follow-up questions after a reply, written from the visitor's
 * point of view, so the chat can offer tappable next-steps. Runs as a lightweight
 * second call on the summary model — failures here must never break the main reply.
 */
async function generateFollowUpQuestions(llm, { userMessage, assistantContent, path }) {
  if (!assistantContent?.trim()) return [];

  try {
    const prompt = `You are suggesting follow-up questions for a visitor chatting with a portfolio AI guide on page "${path || '/'}".

Visitor asked: "${userMessage}"
Guide replied: "${assistantContent}"

Suggest exactly 3 short, natural follow-up questions this visitor might ask next, written in the visitor's own voice (first person, e.g. "What tech did you use?"). Keep each under 8 words. Don't repeat the question just asked. Respond with ONLY a JSON array of 3 strings — no markdown, no extra text.`;

    const response = await llm.invoke([new HumanMessage(prompt)]);
    const text = typeof response?.content === 'string' ? response.content : '';
    const match = text.match(/\[[\s\S]*\]/);
    const parsed = match ? JSON.parse(match[0]) : null;
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((q) => typeof q === 'string' && q.trim()).slice(0, 3);
  } catch {
    return [];
  }
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
      const checkpointer = await getCheckpointer();

      const systemMessage = buildPortfolioSystemMessage(context, path, this.config.persona);

      const finalTools =
        this.config.provider?.supportsTools !== false ? portfolioShowcaseTools : [];

      // `prompt` is re-applied fresh on every call and is never written into
      // checkpointed state, so re-using the same thread_id across turns can't
      // duplicate or stale out the system message.
      const agent = createReactAgent({
        llm,
        tools: finalTools,
        checkpointer,
        prompt: buildPortfolioPrompt(systemMessage.content),
      });

      const threadConfig = { configurable: { thread_id: sessionId } };
      const priorState = await agent.getState(threadConfig);
      const hasPriorState = priorState?.values?.messages?.length > 0;

      // Once a thread has checkpointed state, the caller only needs to send
      // the new message — history lives server-side. `chatHistory` is only
      // consulted to seed a brand-new thread (e.g. older clients that still
      // send it on the first turn).
      let inputMessages;
      if (!hasPriorState) {
        const filteredHistory = chatHistory.filter((msg) => msg && msg.role);
        inputMessages = [
          ...filteredHistory.flatMap((msg) =>
            mapHistoryEntryToMessages(msg, { logger: this.logger })
          ),
          new HumanMessage({ content: userMessage }),
        ];
      } else {
        inputMessages = [new HumanMessage({ content: userMessage })];
      }

      const eventStream = await agent.streamEvents(
        { messages: inputMessages },
        { ...threadConfig, version: 'v2' }
      );

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

      if (assistantContent?.trim()) {
        const followUpLlm = await this.createSummaryChatModel({ temperature: 0.4 });
        const questions = await generateFollowUpQuestions(followUpLlm, {
          userMessage,
          assistantContent,
          path,
        });
        if (questions.length > 0) {
          yield { type: 'follow_up_questions', questions };
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
