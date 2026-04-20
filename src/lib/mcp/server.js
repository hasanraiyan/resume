import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import mongoose from 'mongoose';
import dbConnect from '@/lib/dbConnect';
import Account from '@/models/Account';
import Category from '@/models/Category';
import Transaction from '@/models/Transaction';
import { serializeAccount, serializeCategory, serializeTransaction } from '@/lib/money-serializers';
import { computeAccountSummaries } from '@/lib/money-account-summary';

async function getAccountsWithBalances() {
  const [accounts, transactions] = await Promise.all([
    Account.find({ deletedAt: null }).sort({ createdAt: 1 }).lean(),
    Transaction.find({ deletedAt: null }).select('type amount account toAccount').lean(),
  ]);
  return computeAccountSummaries(accounts, transactions).accounts;
}

function isValidObjectId(v) {
  return typeof v === 'string' && mongoose.Types.ObjectId.isValid(v);
}

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
      await dbConnect();
      const accounts = await getAccountsWithBalances();
      const data = accounts.map((a) => {
        const s = serializeAccount(a);
        return {
          id: s.id,
          name: s.name,
          icon: s.icon,
          balance: s.currentBalance,
          currency: s.currency,
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
      await dbConnect();
      const cats = await Category.find({ deletedAt: null }).sort({ type: 1, name: 1 }).lean();
      const data = cats.map((c) => {
        const s = serializeCategory(c);
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
      await dbConnect();
      const query = { deletedAt: null };
      if (type) query.type = type;
      const txns = await Transaction.find(query)
        .populate('category', 'name icon type')
        .populate('account', 'name icon')
        .populate('toAccount', 'name icon')
        .sort({ date: -1 })
        .limit(limit || 20)
        .lean();
      const data = txns.map((t) => {
        const s = serializeTransaction(t);
        return {
          id: s.id,
          type: s.type,
          amount: s.amount,
          description: s.description,
          category: s.category?.name ?? null,
          account: s.account?.name ?? null,
          toAccount: s.toAccount?.name ?? null,
          date: s.date,
        };
      });
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
      await dbConnect();
      const [txns, accounts] = await Promise.all([
        Transaction.find({ deletedAt: null, type: { $in: ['income', 'expense'] } })
          .populate('category', 'name type')
          .lean(),
        getAccountsWithBalances(),
      ]);

      let totalIncome = 0;
      let totalExpense = 0;
      const catMap = {};

      for (const t of txns) {
        if (t.type === 'income') totalIncome += t.amount;
        else totalExpense += t.amount;
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
      const totalBalance = accounts.reduce((s, a) => s + (a.currentBalance || 0), 0);

      const summary = {
        totalIncome,
        totalExpense,
        netFlow: totalIncome - totalExpense,
        totalAccountBalance: totalBalance,
        topExpenseCategories: breakdown.filter((c) => c.type === 'expense').slice(0, 10),
        topIncomeCategories: breakdown.filter((c) => c.type === 'income').slice(0, 5),
        accounts: accounts.map((a) => ({
          name: a.name,
          balance: a.currentBalance || 0,
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
      const errors = [];

      if (!isValidObjectId(accountId)) errors.push('accountId is not a valid ObjectId');

      if (type === 'transfer') {
        if (!isValidObjectId(toAccountId))
          errors.push('toAccountId is required and must be valid for transfers');
        if (accountId === toAccountId) errors.push('source and destination accounts must differ');
      } else {
        if (!isValidObjectId(categoryId))
          errors.push('categoryId is required and must be valid for income/expense');
      }

      if (errors.length > 0) {
        return {
          content: [{ type: 'text', text: `Validation errors: ${errors.join('; ')}` }],
          isError: true,
        };
      }

      await dbConnect();

      const payload = {
        type,
        amount,
        description: description || '',
        account: accountId,
        date: date ? new Date(date) : new Date(),
      };

      if (type === 'transfer') {
        payload.toAccount = toAccountId;
      } else {
        payload.category = categoryId;
      }

      const txn = new Transaction(payload);
      await txn.save();

      const populated = await Transaction.findById(txn._id)
        .populate('category', 'name icon type')
        .populate('account', 'name icon')
        .populate('toAccount', 'name icon')
        .lean();

      const s = serializeTransaction(populated);
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
      if (!isValidObjectId(id)) {
        return { content: [{ type: 'text', text: 'Invalid transaction ID' }], isError: true };
      }
      await dbConnect();
      const result = await Transaction.findOneAndUpdate(
        { _id: id, deletedAt: null },
        { $set: { deletedAt: new Date() }, $inc: { syncVersion: 1 } }
      );
      if (!result) {
        return { content: [{ type: 'text', text: 'Transaction not found' }], isError: true };
      }
      return {
        content: [{ type: 'text', text: JSON.stringify({ success: true, deletedId: id }) }],
      };
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
      if (!isValidObjectId(id)) {
        return { content: [{ type: 'text', text: 'Invalid transaction ID' }], isError: true };
      }

      const errors = [];
      if (categoryId !== undefined && !isValidObjectId(categoryId))
        errors.push('categoryId is not a valid ObjectId');
      if (accountId !== undefined && !isValidObjectId(accountId))
        errors.push('accountId is not a valid ObjectId');
      if (toAccountId !== undefined && !isValidObjectId(toAccountId))
        errors.push('toAccountId is not a valid ObjectId');
      if (errors.length > 0) {
        return {
          content: [{ type: 'text', text: `Validation errors: ${errors.join('; ')}` }],
          isError: true,
        };
      }

      await dbConnect();

      const existing = await Transaction.findOne({ _id: id, deletedAt: null }).lean();
      if (!existing) {
        return { content: [{ type: 'text', text: 'Transaction not found' }], isError: true };
      }

      if (existing.type === 'transfer' && categoryId) {
        return {
          content: [{ type: 'text', text: 'Cannot set categoryId on a transfer' }],
          isError: true,
        };
      }
      if (existing.type !== 'transfer' && toAccountId) {
        return {
          content: [{ type: 'text', text: 'Cannot set toAccountId on a non-transfer' }],
          isError: true,
        };
      }

      const patch = {};
      if (amount !== undefined) patch.amount = amount;
      if (description !== undefined) patch.description = description;
      if (categoryId) patch.category = categoryId;
      if (accountId) patch.account = accountId;
      if (toAccountId) patch.toAccount = toAccountId;
      if (date) patch.date = new Date(date);

      const txn = await Transaction.findByIdAndUpdate(
        id,
        { $set: patch, $inc: { syncVersion: 1 } },
        { new: true }
      )
        .populate('category', 'name icon type')
        .populate('account', 'name icon')
        .populate('toAccount', 'name icon')
        .lean();

      if (!txn) {
        return { content: [{ type: 'text', text: 'Transaction not found' }], isError: true };
      }

      const s = serializeTransaction(txn);
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
    }
  );

  return server;
}
