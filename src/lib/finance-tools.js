import dbConnect from '@/lib/dbConnect';
import Account from '@/models/Account';
import Category from '@/models/Category';
import Transaction from '@/models/Transaction';
import { serializeAccount, serializeCategory, serializeTransaction } from '@/lib/money-serializers';

export async function getAccounts() {
  await dbConnect();
  const accounts = await Account.find({ deletedAt: null }).sort({ createdAt: 1 }).lean();
  return accounts.map(serializeAccount);
}

export async function getCategories() {
  await dbConnect();
  const categories = await Category.find({ deletedAt: null }).sort({ type: 1, name: 1 }).lean();
  return categories.map(serializeCategory);
}

export async function getTransactions({ startDate, endDate, type, accountId, limit = 50 } = {}) {
  await dbConnect();
  const query = { deletedAt: null };
  if (startDate) query.date = { ...query.date, $gte: new Date(startDate) };
  if (endDate) query.date = { ...query.date, $lte: new Date(endDate) };
  if (type) query.type = type;
  if (accountId) query.account = accountId;

  const transactions = await Transaction.find(query)
    .populate('category', 'name icon type color')
    .populate('account', 'name icon')
    .populate('toAccount', 'name icon')
    .sort({ date: -1 })
    .limit(limit)
    .lean();

  return transactions.map(serializeTransaction);
}

export async function getAnalysis({ startDate, endDate } = {}) {
  await dbConnect();
  const dateQuery = {};
  if (startDate || endDate) {
    dateQuery.date = {};
    if (startDate) dateQuery.date.$gte = new Date(startDate);
    if (endDate) dateQuery.date.$lte = new Date(endDate);
  }

  const transactions = await Transaction.find({
    ...dateQuery,
    deletedAt: null,
    type: { $in: ['income', 'expense'] },
  })
    .populate('category', 'name icon type color')
    .populate('account', 'name icon')
    .lean();

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

  return {
    categoryBreakdown,
    dailyFlow,
    accountAnalysis,
    totalExpense,
    totalIncome,
    netBalance: totalIncome - totalExpense,
  };
}
