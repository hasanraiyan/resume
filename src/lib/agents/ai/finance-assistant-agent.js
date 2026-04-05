import { AGENT_IDS } from '@/lib/constants/agents';
import BaseAgent from '../BaseAgent';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { createReactAgent } from '@langchain/langgraph/prebuilt';

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

    const systemMessage = new SystemMessage({
      content: `${persona}

IMPORTANT: You are currently operating without access to financial data tools. 
When users ask about their specific finances (transactions, balances, budgets), 
politely explain that data integration is being set up and provide general financial guidance instead.
Keep responses concise and helpful.`,
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
      tools: [],
      messageModifier: async (msgs) => msgs,
    });

    const eventStream = await agent.streamEvents({ messages }, { version: 'v2' });

    for await (const event of eventStream) {
      if (event.event === 'on_chat_model_stream' && event.data.chunk?.content) {
        yield { type: 'content', message: event.data.chunk.content };
      }
    }
  }

  async _onExecute(input) {
    throw new Error('FinanceAssistantAgent only supports streamExecute');
  }
}

export default FinanceAssistantAgent;
