import dbConnect from '@/lib/dbConnect';
import {
  createAccount,
  createBudget,
  createCategory,
  createTransaction,
  deleteAccount,
  deleteBudget,
  deleteCategory,
  deleteTransaction,
  getAccounts,
  getBudgets,
  getCategories,
  getTransactions,
  updateAccount,
  updateBudget,
  updateCategory,
  updateTransaction,
} from '@/lib/apps/pocketly/service/service';
import { computeAccountSummariesFromDb } from '@/lib/money-account-summary';
import Account from '@/models/Account';
import Transaction from '@/models/Transaction';

const DEFAULT_TRANSACTION_LIMIT = 50;
const MAX_TRANSACTION_LIMIT = 200;

export function getDefaultPeriod() {
  const now = new Date();
  const start = new Date(now);
  const day = start.getDay();
  start.setDate(start.getDate() - day + (day === 0 ? -6 : 1));
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { startDate: start.toISOString(), endDate: end.toISOString() };
}

function clampLimit(limit, fallback = DEFAULT_TRANSACTION_LIMIT) {
  const parsed = Number(limit);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(Math.floor(parsed), MAX_TRANSACTION_LIMIT);
}

function idsMatch(record, id) {
  return record?.id === id || record?._id === id;
}

function makeDateQuery({ startDate, endDate } = {}) {
  const query = { deletedAt: null };
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(endDate);
  }
  return query;
}

function totalAccountBalance(accounts) {
  return accounts.reduce((sum, account) => {
    if (account.ignored) return sum;
    return sum + (account.currentBalance ?? account.balance ?? account.initialBalance ?? 0);
  }, 0);
}

export async function getPocketlyBootstrap({ startDate, endDate } = {}) {
  const period = {
    startDate: startDate || getDefaultPeriod().startDate,
    endDate: endDate || getDefaultPeriod().endDate,
  };

  await dbConnect();

  const [accounts, categories, budgets, transactions, totalTransactionCount] = await Promise.all([
    getAccounts({ includeBalances: true }),
    getCategories(),
    getBudgets(),
    getTransactions(period),
    Transaction.countDocuments({ deletedAt: null }),
  ]);

  return {
    ...period,
    accounts,
    categories,
    budgets,
    transactions,
    stats: {
      totalAccountBalance: totalAccountBalance(accounts),
      totalTransactionCount,
      accountCount: accounts.length,
      categoryCount: categories.length,
      budgetCount: budgets.length,
    },
  };
}

export async function listPocketlyTransactions(params = {}) {
  return getTransactions({
    ...params,
    limit: clampLimit(params.limit),
  });
}

export async function searchPocketlyTransactions(params = {}) {
  const limit = clampLimit(params.limit, 25);
  const query = (params.query || '').trim().toLowerCase();
  const candidates = await getTransactions({
    startDate: params.startDate,
    endDate: params.endDate,
    type: params.type,
    account: params.account,
    category: params.category,
    limit: Math.max(limit, 100),
  });

  if (!query) return candidates.slice(0, limit);

  return candidates
    .filter((transaction) => {
      const haystack = [
        transaction.description,
        transaction.note,
        transaction.type,
        transaction.category?.name,
        transaction.account?.name,
        transaction.toAccount?.name,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    })
    .slice(0, limit);
}

export async function getPocketlyAnalysis({ startDate, endDate } = {}) {
  await dbConnect();
  const query = makeDateQuery({ startDate, endDate });

  const [categoryBreakdown, dailyFlow, accountAnalysis, allAccounts, totals] = await Promise.all([
    Transaction.aggregate([
      { $match: { ...query, type: { $in: ['income', 'expense'] } } },
      {
        $group: {
          _id: { category: '$category', type: '$type' },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id.category',
          foreignField: '_id',
          as: 'category',
        },
      },
      { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          categoryId: '$_id.category',
          type: '$_id.type',
          total: 1,
          count: 1,
          name: { $ifNull: ['$category.name', 'Uncategorized'] },
          icon: { $ifNull: ['$category.icon', 'dollar-sign'] },
          color: { $ifNull: ['$category.color', '#000000'] },
        },
      },
      { $sort: { total: -1 } },
    ]),
    Transaction.aggregate([
      { $match: { ...query, type: { $in: ['income', 'expense'] } } },
      {
        $group: {
          _id: { date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } }, type: '$type' },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.date': 1 } },
    ]),
    Transaction.aggregate([
      { $match: { ...query, type: { $in: ['income', 'expense'] } } },
      {
        $group: {
          _id: { account: '$account', type: '$type' },
          total: { $sum: '$amount' },
        },
      },
      {
        $lookup: {
          from: 'accounts',
          localField: '_id.account',
          foreignField: '_id',
          as: 'account',
        },
      },
      { $unwind: { path: '$account', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          accountId: '$_id.account',
          type: '$_id.type',
          total: 1,
          name: { $ifNull: ['$account.name', 'Unknown'] },
          icon: { $ifNull: ['$account.icon', 'wallet'] },
        },
      },
    ]),
    Account.find({ deletedAt: null }).lean(),
    Transaction.aggregate([
      { $match: { ...query, type: { $in: ['income', 'expense'] } } },
      { $group: { _id: '$type', total: { $sum: '$amount' } } },
    ]),
  ]);

  const accountSummary = await computeAccountSummariesFromDb(allAccounts);
  const accountBalanceMap = new Map(
    accountSummary.accounts.map((account) => [
      account._id?.toString() || account.id?.toString(),
      account.currentBalance ?? account.balance ?? 0,
    ])
  );

  let totalExpense = 0;
  let totalIncome = 0;
  for (const total of totals) {
    if (total._id === 'expense') totalExpense = total.total;
    if (total._id === 'income') totalIncome = total.total;
  }

  return {
    categoryBreakdown: categoryBreakdown.map((category) => ({
      ...category,
      categoryId: category.categoryId?.toString(),
    })),
    dailyFlow: dailyFlow.map((entry) => ({
      date: entry._id.date,
      type: entry._id.type,
      total: entry.total,
    })),
    accountAnalysis: accountAnalysis.map((account) => ({
      ...account,
      accountId: account.accountId?.toString(),
      currentBalance: account.accountId
        ? (accountBalanceMap.get(account.accountId.toString()) ?? 0)
        : 0,
    })),
    totalExpense,
    totalIncome,
    netFlow: totalIncome - totalExpense,
    totalAccountBalance: accountSummary.totalAccountBalance,
  };
}

export async function assertAccountId(id, label = 'account') {
  if (!id) throw new Error(`Missing ${label} id`);
  const accounts = await getAccounts({ includeBalances: false });
  if (!accounts.some((account) => idsMatch(account, id))) {
    throw new Error(`Unknown ${label} id: ${id}`);
  }
}

export async function assertCategoryId(id, { required = false, type } = {}) {
  if (!id) {
    if (required) throw new Error('Missing category id');
    return;
  }
  const categories = await getCategories();
  const category = categories.find((item) => idsMatch(item, id));
  if (!category) throw new Error(`Unknown category id: ${id}`);
  if (type && category.type !== type) {
    throw new Error(`Category ${id} must be a ${type} category`);
  }
}

function assertPatchHasFields(patch) {
  if (!patch || Object.keys(patch).length === 0) {
    throw new Error('Provide at least one field to update');
  }
}

export async function createPocketlyTransaction(payload) {
  await assertAccountId(payload.account);
  await assertCategoryId(payload.category);

  if (payload.type === 'transfer') {
    await assertAccountId(payload.toAccount, 'destination account');
    if (payload.account === payload.toAccount) {
      throw new Error('Transfer source and destination accounts must be different');
    }
  } else if (payload.toAccount) {
    await assertAccountId(payload.toAccount, 'destination account');
  }

  return createTransaction({
    ...payload,
    date: payload.date || new Date().toISOString(),
  });
}

export async function updatePocketlyTransaction(id, patch) {
  assertPatchHasFields(patch);
  if (patch.account) await assertAccountId(patch.account);
  if (patch.category !== undefined) await assertCategoryId(patch.category);
  if (patch.toAccount) await assertAccountId(patch.toAccount, 'destination account');
  if (patch.account && patch.toAccount && patch.account === patch.toAccount) {
    throw new Error('Transfer source and destination accounts must be different');
  }
  return updateTransaction(id, patch);
}

export async function createPocketlyBudget(payload) {
  await assertCategoryId(payload.category, { required: true, type: 'expense' });
  return createBudget(payload);
}

export async function updatePocketlyBudget(id, patch) {
  assertPatchHasFields(patch);
  if (patch.category) await assertCategoryId(patch.category, { required: true, type: 'expense' });
  return updateBudget(id, patch);
}

export {
  createAccount,
  createCategory,
  deleteAccount,
  deleteBudget,
  deleteCategory,
  deleteTransaction,
  getAccounts,
  getBudgets,
  getCategories,
  updateAccount,
  updateCategory,
};
