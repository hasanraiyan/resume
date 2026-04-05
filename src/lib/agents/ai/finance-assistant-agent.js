import { AGENT_IDS } from '@/lib/constants/agents';
import BaseAgent from '../BaseAgent';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { getAccounts, getCategories, getTransactions, getAnalysis } from '@/lib/finance-tools';

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

    const getAccountsTool = tool(
      async () => {
        const accounts = await getAccounts();
        return JSON.stringify(
          accounts.map((a) => ({
            name: a.name,
            icon: a.icon,
            balance: a.initialBalance,
            currency: a.currency,
          }))
        );
      },
      {
        name: 'get_accounts',
        description: 'Get all user accounts with their names, types, and balances.',
        schema: z.object({}),
      }
    );

    const getCategoriesTool = tool(
      async () => {
        const categories = await getCategories();
        return JSON.stringify(
          categories.map((c) => ({ name: c.name, type: c.type, icon: c.icon, color: c.color }))
        );
      },
      {
        name: 'get_categories',
        description: 'Get all income and expense categories.',
        schema: z.object({}),
      }
    );

    const getTransactionsTool = tool(
      async ({ type, limit }) => {
        const transactions = await getTransactions({ type, limit: limit || 20 });
        return JSON.stringify(
          transactions.map((t) => ({
            type: t.type,
            amount: t.amount,
            description: t.description,
            category: t.category?.name || 'Uncategorized',
            account: t.account?.name || 'Unknown',
            date: t.date,
          }))
        );
      },
      {
        name: 'get_transactions',
        description:
          'Get recent transactions. Optionally filter by type (income, expense, transfer) and limit.',
        schema: z.object({
          type: z
            .enum(['income', 'expense', 'transfer'])
            .optional()
            .describe('Filter by transaction type'),
          limit: z
            .number()
            .optional()
            .describe('Maximum number of transactions to return (default 20)'),
        }),
      }
    );

    const getAnalysisTool = tool(
      async ({ startDate, endDate }) => {
        const analysis = await getAnalysis({ startDate, endDate });
        return JSON.stringify({
          totalExpense: analysis.totalExpense,
          totalIncome: analysis.totalIncome,
          netBalance: analysis.netBalance,
          topExpenseCategories: analysis.categoryBreakdown
            .filter((c) => c.type === 'expense')
            .slice(0, 5)
            .map((c) => ({ name: c.name, total: c.total, count: c.count })),
          topIncomeCategories: analysis.categoryBreakdown
            .filter((c) => c.type === 'income')
            .slice(0, 5)
            .map((c) => ({ name: c.name, total: c.total, count: c.count })),
          accountActivity: analysis.accountAnalysis.map((a) => ({
            name: a.name,
            expense: a.expense,
            income: a.income,
          })),
        });
      },
      {
        name: 'get_analysis',
        description:
          'Get financial analysis including totals, category breakdowns, and account activity. Optionally filter by date range.',
        schema: z.object({
          startDate: z.string().optional().describe('Start date in ISO format'),
          endDate: z.string().optional().describe('End date in ISO format'),
        }),
      }
    );

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
      tools: [getAccountsTool, getCategoriesTool, getTransactionsTool, getAnalysisTool],
      messageModifier: async (msgs) => msgs,
    });

    const eventStream = await agent.streamEvents({ messages }, { version: 'v2' });

    for await (const event of eventStream) {
      if (event.event === 'on_chat_model_stream' && event.data.chunk?.content) {
        yield { type: 'content', message: event.data.chunk.content };
      } else if (event.event === 'on_tool_start') {
        yield { type: 'status', message: `🔍 Looking up ${event.name}...` };
      }
    }
  }

  async _onExecute(input) {
    throw new Error('FinanceAssistantAgent only supports streamExecute');
  }
}

export default FinanceAssistantAgent;
