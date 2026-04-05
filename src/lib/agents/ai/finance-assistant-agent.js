import { AGENT_IDS } from '@/lib/constants/agents';
import BaseAgent from '../BaseAgent';
import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { createFinanceTools } from '../utils/finance-tools';

function parseToolOutput(output) {
  if (!output) return null;

  if (typeof output === 'string') {
    try {
      return JSON.parse(output);
    } catch {
      return null;
    }
  }

  return output;
}

function getToolLabel(toolName) {
  const labels = {
    get_analysis: 'Analyzing your finances',
    get_transactions: 'Reviewing transactions',
    get_accounts: 'Checking accounts',
    get_categories: 'Reviewing categories',
  };

  return labels[toolName] || `Using ${toolName}`;
}

function buildUiBlocks(toolName, output) {
  const parsed = parseToolOutput(output);
  if (!parsed) return [];

  if (toolName === 'get_analysis') {
    return [
      {
        kind: 'summary_cards',
        title: 'Financial snapshot',
        action: { type: 'switch_tab', tab: 'analysis', label: 'Open analysis' },
        data: {
          totalIncome: parsed.totalIncome || 0,
          totalExpense: parsed.totalExpense || 0,
          netFlow: parsed.netFlow || 0,
          totalAccountBalance: parsed.totalAccountBalance || 0,
        },
      },
      {
        kind: 'category_breakdown',
        title: 'Top spending categories',
        action: { type: 'switch_tab', tab: 'analysis', label: 'View breakdown' },
        data: {
          mode: 'totals',
          items: parsed.topExpenseCategories || [],
        },
      },
    ].filter((block) => {
      if (block.kind === 'category_breakdown') {
        return block.data.items.length > 0;
      }

      return true;
    });
  }

  if (toolName === 'get_transactions' && Array.isArray(parsed)) {
    return [
      {
        kind: 'transaction_list',
        title: 'Matching transactions',
        action: { type: 'switch_tab', tab: 'records', label: 'Open records' },
        data: {
          items: parsed.slice(0, 6),
        },
      },
    ];
  }

  if (toolName === 'get_accounts' && Array.isArray(parsed)) {
    return [
      {
        kind: 'accounts_snapshot',
        title: 'Account balances',
        action: { type: 'switch_tab', tab: 'accounts', label: 'Open accounts' },
        data: {
          items: parsed.slice(0, 6),
        },
      },
    ];
  }

  if (toolName === 'get_categories' && Array.isArray(parsed)) {
    const income = parsed.filter((item) => item.type === 'income');
    const expense = parsed.filter((item) => item.type === 'expense');

    return [
      {
        kind: 'category_breakdown',
        title: 'Category setup',
        action: { type: 'switch_tab', tab: 'categories', label: 'Open categories' },
        data: {
          mode: 'groups',
          income,
          expense,
        },
      },
    ];
  }

  return [];
}

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
    financeTools.forEach((tool, index) => {
      this.logger.info(
        `  Tool ${index + 1}: name="${tool.name}", description="${tool.description?.substring(0, 80)}..."`
      );
    });

    const systemMessage = new SystemMessage({
      content: `${persona}

You have access to real financial data through tools. Use them to answer questions accurately.
Format currency amounts with ₹ symbol and Indian number format (e.g., ₹1,50,000).
Be concise and provide actionable insights, not just raw data.
When you use tools, the app may automatically show supporting finance UI cards for the user.`,
    });

    const messages = [
      systemMessage,
      ...chatHistory.map((msg) => {
        if (msg.role === 'user') return new HumanMessage({ content: msg.content || '' });
        if (msg.role === 'assistant') return new AIMessage({ content: msg.content || '' });
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
    const activeToolCalls = new Map();
    let fallbackToolCounter = 0;

    for await (const event of eventStream) {
      this.logger.info(
        `[EVENT] type="${event.event}", name="${event.name || 'N/A'}"`,
        JSON.stringify(event.data).substring(0, 200)
      );

      if (event.event === 'on_chat_model_stream' && event.data.chunk?.content) {
        yield { type: 'content', message: event.data.chunk.content };
      } else if (event.event === 'on_tool_start') {
        const toolCallId =
          event.run_id || event.data?.run_id || `${event.name}-${++fallbackToolCounter}`;
        activeToolCalls.set(toolCallId, event.name);

        yield {
          type: 'tool_start',
          toolName: event.name,
          toolCallId,
          label: getToolLabel(event.name),
        };
      } else if (event.event === 'on_tool_end') {
        this.logger.info(
          `[TOOL_RESULT] name="${event.name}", output length="${JSON.stringify(event.data.output || '').length}"`
        );

        const toolCallId = event.run_id || event.data?.run_id || null;
        const toolName = activeToolCalls.get(toolCallId) || event.name;

        yield {
          type: 'tool_end',
          toolName,
          toolCallId,
          uiBlocks: buildUiBlocks(toolName, event.data.output),
        };

        if (toolCallId) {
          activeToolCalls.delete(toolCallId);
        }
      }
    }
  }

  async _onExecute(input) {
    throw new Error('FinanceAssistantAgent only supports streamExecute');
  }
}

export default FinanceAssistantAgent;
