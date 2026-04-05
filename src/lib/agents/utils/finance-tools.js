import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import dbConnect from '@/lib/dbConnect';
import Account from '@/models/Account';
import Category from '@/models/Category';
import Transaction from '@/models/Transaction';
import { serializeAccount, serializeCategory, serializeTransaction } from '@/lib/money-serializers';

async function ensureDb() {
  await dbConnect();
}

async function getAccountsWithComputedBalances() {
  const [accounts, transactions] = await Promise.all([
    Account.find({ deletedAt: null }).sort({ createdAt: 1 }).lean(),
    Transaction.find({ deletedAt: null }).select('type amount account toAccount').lean(),
  ]);

  const balanceMap = new Map();

  for (const account of accounts) {
    balanceMap.set(account._id.toString(), Number(account.initialBalance) || 0);
  }

  for (const transaction of transactions) {
    const amount = Number(transaction.amount) || 0;
    const accountId = transaction.account?.toString?.() || null;
    const toAccountId = transaction.toAccount?.toString?.() || null;

    if (transaction.type === 'expense' && accountId && balanceMap.has(accountId)) {
      balanceMap.set(accountId, balanceMap.get(accountId) - amount);
      continue;
    }

    if (transaction.type === 'income' && accountId && balanceMap.has(accountId)) {
      balanceMap.set(accountId, balanceMap.get(accountId) + amount);
      continue;
    }

    if (transaction.type === 'transfer') {
      if (accountId && balanceMap.has(accountId)) {
        balanceMap.set(accountId, balanceMap.get(accountId) - amount);
      }
      if (toAccountId && balanceMap.has(toAccountId)) {
        balanceMap.set(toAccountId, balanceMap.get(toAccountId) + amount);
      }
    }
  }

  return accounts.map((account) => ({
    ...account,
    currentBalance: balanceMap.get(account._id.toString()) ?? 0,
  }));
}

export function createGetAccountsTool() {
  return tool(
    async () => {
      await ensureDb();
      const accounts = await getAccountsWithComputedBalances();
      const serialized = accounts.map(serializeAccount);
      return JSON.stringify(
        serialized.map((a) => ({
          id: a.id,
          name: a.name,
          icon: a.icon,
          balance: a.currentBalance,
          initialBalance: a.initialBalance,
          currency: a.currency,
        }))
      );
    },
    {
      name: 'get_accounts',
      description:
        'Get all user accounts with their names, types, and balances. Use this when the user asks about their accounts, wallets, or where their money is stored.',
      schema: z.object({}),
    }
  );
}

export function createGetCategoriesTool() {
  return tool(
    async () => {
      await ensureDb();
      const categories = await Category.find({ deletedAt: null }).sort({ type: 1, name: 1 }).lean();
      const serialized = categories.map(serializeCategory);
      return JSON.stringify(
        serialized.map((c) => ({
          id: c.id,
          name: c.name,
          type: c.type,
          icon: c.icon,
          color: c.color,
        }))
      );
    },
    {
      name: 'get_categories',
      description:
        'Get all income and expense categories. Use this when the user asks about their category setup or what categories they use.',
      schema: z.object({}),
    }
  );
}

export function createGetTransactionsTool() {
  return tool(
    async ({ type, limit }) => {
      await ensureDb();
      const query = { deletedAt: null };
      if (type) query.type = type;

      const transactions = await Transaction.find(query)
        .populate('category', 'name icon type color')
        .populate('account', 'name icon')
        .populate('toAccount', 'name icon')
        .sort({ date: -1 })
        .limit(limit || 20)
        .lean();

      const serialized = transactions.map(serializeTransaction);
      return JSON.stringify(
        serialized.map((t) => ({
          id: t.id,
          type: t.type,
          amount: t.amount,
          description: t.description,
          category: t.category?.name || 'Uncategorized',
          account: t.account?.name || 'Unknown',
          toAccount: t.toAccount?.name,
          date: t.date,
        }))
      );
    },
    {
      name: 'get_transactions',
      description:
        'Get recent transactions. Optionally filter by type (income, expense, transfer) and limit. Use this when the user asks about recent spending, recent income, or specific transactions.',
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
}

export function createGetAnalysisTool() {
  return tool(
    async () => {
      await ensureDb();
      const [transactions, accounts] = await Promise.all([
        Transaction.find({
          deletedAt: null,
          type: { $in: ['income', 'expense'] },
        })
          .populate('category', 'name icon type color')
          .populate('account', 'name icon')
          .lean(),
        getAccountsWithComputedBalances(),
      ]);

      const categoryBreakdown = [];
      const dailyFlow = [];
      const accountAnalysis = [];
      let totalExpense = 0;
      let totalIncome = 0;

      const categoryMap = {};
      const dailyMap = {};
      const accountMap = {};

      for (const t of transactions) {
        const amount = t.amount;
        if (t.type === 'expense') totalExpense += amount;
        if (t.type === 'income') totalIncome += amount;

        const catKey = `${t.category?._id || 'none'}-${t.type}`;
        if (!categoryMap[catKey]) {
          categoryMap[catKey] = {
            categoryId: t.category?._id?.toString() || null,
            type: t.type,
            total: 0,
            count: 0,
            name: t.category?.name || 'Uncategorized',
            icon: t.category?.icon || 'tag',
            color: t.category?.color || '#999999',
          };
        }
        categoryMap[catKey].total += amount;
        categoryMap[catKey].count += 1;

        const dateStr = new Date(t.date).toISOString().split('T')[0];
        const dayKey = `${dateStr}-${t.type}`;
        if (!dailyMap[dayKey]) {
          dailyMap[dayKey] = { date: dateStr, type: t.type, total: 0 };
        }
        dailyMap[dayKey].total += amount;

        const accKey = `${t.account?._id || 'none'}-${t.type}`;
        if (!accountMap[accKey]) {
          accountMap[accKey] = {
            accountId: t.account?._id?.toString() || null,
            type: t.type,
            total: 0,
            name: t.account?.name || 'Unknown',
            icon: t.account?.icon || 'wallet',
          };
        }
        accountMap[accKey].total += amount;
      }

      categoryBreakdown.push(...Object.values(categoryMap).sort((a, b) => b.total - a.total));
      dailyFlow.push(...Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date)));
      accountAnalysis.push(...Object.values(accountMap));

      const result = {
        totalExpense,
        totalIncome,
        netBalance: totalIncome - totalExpense,
        topExpenseCategories: categoryBreakdown
          .filter((c) => c.type === 'expense')
          .slice(0, 10)
          .map((c) => ({ name: c.name, total: c.total, count: c.count })),
        topIncomeCategories: categoryBreakdown
          .filter((c) => c.type === 'income')
          .slice(0, 5)
          .map((c) => ({ name: c.name, total: c.total, count: c.count })),
        accountActivity: accountAnalysis.map((a) => ({
          name: a.name,
          expense:
            accountAnalysis.find((x) => x.accountId === a.accountId && x.type === 'expense')
              ?.total || 0,
          income:
            accountAnalysis.find((x) => x.accountId === a.accountId && x.type === 'income')
              ?.total || 0,
          balance:
            accounts.find((account) => account._id.toString() === a.accountId)?.currentBalance || 0,
        })),
        dailyExpenseFlow: dailyFlow
          .filter((d) => d.type === 'expense')
          .slice(-14)
          .map((d) => ({ date: d.date, total: d.total })),
      };

      return JSON.stringify(result);
    },
    {
      name: 'get_analysis',
      description:
        'Get comprehensive financial analysis including total income, total expenses, net balance, top spending categories, and account activity. Use this when the user asks for a summary, overview, or analysis of their finances.',
      schema: z.object({}),
    }
  );
}

export function createFinanceTools() {
  return [
    createGetAccountsTool(),
    createGetCategoriesTool(),
    createGetTransactionsTool(),
    createGetAnalysisTool(),
  ];
}
