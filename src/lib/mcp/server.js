import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import mongoose from 'mongoose';
import { getAccounts, getCategories, getTransactions, getFinancialSummary, createTransaction, updateTransaction, deleteTransaction } from '@/lib/apps/pocketly/service/service';

export function createMcpServer() {
  const server = new McpServer({
    name: 'pocketly',
    version: '1.0.0',
  });

  server.registerTool(
    'get_accounts',
    {
      description: 'List all accounts with current balances.',
      inputSchema: {},
    },
    async () => {
      const accounts = await getAccounts({ includeBalances: true });
      const data = accounts.map((a) => {
        return {
          id: a.id,
          name: a.name,
          icon: a.icon,
          balance: a.balance || 0,
          currency: a.currency || 'INR',
        };
      });
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.registerTool(
    'get_categories',
    {
      description: 'List all income and expense categories.',
      inputSchema: {},
    },
    async () => {
      const cats = await getCategories();
      const data = cats.map((s) => {
        return { id: s.id, name: s.name, type: s.type, icon: s.icon };
      });
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.registerTool(
    'get_transactions',
    {
      description: 'List recent transactions. Optionally filter by type and limit the count.',
      inputSchema: {
        type: z.enum(['income', 'expense', 'transfer']).optional().describe('Filter by type'),
        limit: z.number().int().min(1).max(100).optional().describe('Max results (default 20)'),
      },
    },
    async ({ type, limit }) => {
      const txns = await getTransactions({ type, limit });
      const data = txns.map((s) => ({
        id: s.id,
        type: s.type,
        amount: s.amount,
        description: s.description,
        category: s.category?.name ?? null,
        account: s.account?.name ?? null,
        toAccount: s.toAccount?.name ?? null,
        date: s.date,
      }));
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.registerTool(
    'get_financial_summary',
    {
      description:
        'Get a financial overview: total income, expenses, net flow, and per-category breakdown.',
      inputSchema: {},
    },
    async () => {
      const { totalIncome, totalExpense, netIncome, accounts } = await getFinancialSummary();
      const txns = await getTransactions();
      const catMap = {};

      for (const t of txns) {
        if (t.type === 'transfer') continue;
        const key = `${t.category?._id || 'none'}-${t.type}`;
        if (!catMap[key]) {
          catMap[key] = {
            name: t.category?.name || 'Uncategorized',
            type: t.type,
            total: 0,
            count: 0,
          };
        }
        catMap[key].total += t.amount;
        catMap[key].count += 1;
      }

      const breakdown = Object.values(catMap).sort((a, b) => b.total - a.total);
      const totalBalance = accounts.reduce((s, a) => s + (a.balance || 0), 0);

      const summary = {
        totalIncome,
        totalExpense,
        netFlow: netIncome,
        totalAccountBalance: totalBalance,
        topExpenseCategories: breakdown.filter((c) => c.type === 'expense').slice(0, 10),
        topIncomeCategories: breakdown.filter((c) => c.type === 'income').slice(0, 5),
        accounts: accounts.map((a) => ({
          name: a.name,
          balance: a.balance || 0,
          currency: a.currency || 'INR',
        })),
      };

      return { content: [{ type: 'text', text: JSON.stringify(summary, null, 2) }] };
    }
  );

  server.registerTool(
    'create_transaction',
    {
      description:
        'Create a new transaction. Resolve accountId via get_accounts and categoryId via get_categories first.',
      inputSchema: {
        type: z.enum(['income', 'expense', 'transfer']).describe('Transaction type'),
        amount: z.number().positive().describe('Positive amount'),
        description: z.string().optional().describe('Short description'),
        accountId: z.string().describe('MongoDB _id of the source account'),
        categoryId: z
          .string()
          .optional()
          .describe('MongoDB _id of the category (required for income/expense)'),
        toAccountId: z
          .string()
          .optional()
          .describe('MongoDB _id of the destination account (required for transfers)'),
        date: z.string().optional().describe('Date in YYYY-MM-DD (defaults to today)'),
      },
    },
    async ({ type, amount, description, accountId, categoryId, toAccountId, date }) => {
      const payload = {
        type,
        amount,
        description: description || '',
        account: accountId,
        date: date ? new Date(date).toISOString() : new Date().toISOString(),
      };

      if (type === 'transfer') {
        payload.toAccount = toAccountId;
      } else {
        payload.category = categoryId;
      }

      try {
        const s = await createTransaction(payload);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  transaction: {
                    id: s.id,
                    type: s.type,
                    amount: s.amount,
                    description: s.description,
                    category: s.category?.name ?? null,
                    account: s.account?.name ?? null,
                    toAccount: s.toAccount?.name ?? null,
                    date: s.date,
                  },
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (err) {
        return {
          content: [{ type: 'text', text: `Validation errors: ${err.message}` }],
          isError: true,
        };
      }
    }
  );

  server.registerTool(
    'delete_transaction',
    {
      description: 'Soft-delete a transaction by its ID.',
      inputSchema: {
        id: z.string().describe('MongoDB _id of the transaction to delete'),
      },
    },
    async ({ id }) => {
      try {
        await deleteTransaction(id);
        return {
          content: [{ type: 'text', text: JSON.stringify({ success: true, deletedId: id }) }],
        };
      } catch (err) {
        return { content: [{ type: 'text', text: err.message }], isError: true };
      }
    }
  );

  server.registerTool(
    'update_transaction',
    {
      description: 'Update fields of an existing transaction.',
      inputSchema: {
        id: z.string().describe('MongoDB _id of the transaction'),
        amount: z.number().positive().optional(),
        description: z.string().optional(),
        categoryId: z.string().optional().describe('New category _id'),
        accountId: z.string().optional().describe('New source account _id'),
        toAccountId: z.string().optional().describe('New destination account _id (transfers only)'),
        date: z.string().optional().describe('New date YYYY-MM-DD'),
      },
    },
    async ({ id, amount, description, categoryId, accountId, toAccountId, date }) => {
      const patch = {};
      if (amount !== undefined) patch.amount = amount;
      if (description !== undefined) patch.description = description;
      if (categoryId) patch.category = categoryId;
      if (accountId) patch.account = accountId;
      if (toAccountId) patch.toAccount = toAccountId;
      if (date) patch.date = new Date(date).toISOString();

      try {
        const s = await updateTransaction(id, patch);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  transaction: {
                    id: s.id,
                    type: s.type,
                    amount: s.amount,
                    description: s.description,
                    category: s.category?.name ?? null,
                    account: s.account?.name ?? null,
                    toAccount: s.toAccount?.name ?? null,
                    date: s.date,
                  },
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (err) {
        return { content: [{ type: 'text', text: err.message }], isError: true };
      }
    }
  );

  return server;
}
