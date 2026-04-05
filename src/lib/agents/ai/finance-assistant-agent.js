import { AGENT_IDS } from '@/lib/constants/agents';
import BaseAgent from '../BaseAgent';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { createFinanceTools } from '../utils/finance-tools';

class FinanceAssistantAgent extends BaseAgent {
  constructor(agentId = AGENT_IDS.FINANCE_ASSISTANT, config = {}) {
    super(agentId, config);
  }

  async _onInitialize() {
    this.logger.info('Finance Assistant initialized');
  }

  async _validateInput(input) {
    if (!input || !input.userMessage) {
      throw new Error('userMessage is required for Finance Assistant');
    }
  }

  async *_onStreamExecute(input) {
    const { userMessage, chatHistory = [] } = input;

    const llm = await this.createChatModel();
    const persona = this.config.persona || '';
    const financeTools = createFinanceTools();

    this.logger.info(`[TOOLS] Created ${financeTools.length} tools:`);
    financeTools.forEach((t, i) => {
      this.logger.info(
        `  Tool ${i + 1}: name="${t.name}", description="${t.description?.substring(0, 80)}..."`
      );
    });

    const systemMessage = new SystemMessage({
      content: `${persona}

You have access to real financial data through tools. Use them to answer questions accurately.
Format currency amounts with ₹ symbol and Indian number format (e.g., ₹1,50,000).
Be concise and provide actionable insights, not just raw data.`,
    });

    const messages = [
      systemMessage,
      ...chatHistory.map((msg) => {
        if (msg.role === 'user') return new HumanMessage({ content: msg.content || '' });
        if (msg.role === 'assistant') return new HumanMessage({ content: msg.content || '' });
        return new HumanMessage({ content: msg.content || '' });
      }),
      new HumanMessage({ content: userMessage }),
    ];

    const agent = createReactAgent({
      llm,
      tools: financeTools,
      messageModifier: async (msgs) => msgs,
    });

    this.logger.info(
      `[AGENT] Created ReactAgent with ${financeTools.length} tools, starting stream...`
    );

    const eventStream = await agent.streamEvents({ messages }, { version: 'v2' });

    for await (const event of eventStream) {
      this.logger.info(
        `[EVENT] type="${event.event}", name="${event.name || 'N/A'}"`,
        JSON.stringify(event.data).substring(0, 200)
      );

      if (event.event === 'on_chat_model_stream' && event.data.chunk?.content) {
        yield { type: 'content', message: event.data.chunk.content };
      } else if (event.event === 'on_tool_start') {
        yield { type: 'status', message: `🔍 Looking up ${event.name}...` };
      } else if (event.event === 'on_tool_end') {
        this.logger.info(
          `[TOOL_RESULT] name="${event.name}", output length="${JSON.stringify(event.data.output || '').length}"`
        );
      }
    }
  }

  async _onExecute(input) {
    throw new Error('FinanceAssistantAgent only supports streamExecute');
  }
}

export default FinanceAssistantAgent;
