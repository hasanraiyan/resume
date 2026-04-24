import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Account from '@/models/Account';
import Category from '@/models/Category';
import Transaction from '@/models/Transaction';
import Budget from '@/models/Budget';
import { requireAdminAuth } from '@/lib/money-auth';
import {
  serializeAccount,
  serializeCategory,
  serializeTransaction,
  serializeBudget,
} from '@/lib/money-serializers';
import { computeAccountSummaries } from '@/lib/money-account-summary';

export async function GET(request) {
  const session = await requireAdminAuth();
  if (typeof session !== 'object') return session;

  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const periodQuery = { deletedAt: null };
    if (startDate || endDate) {
      periodQuery.date = {};
      if (startDate) periodQuery.date.$gte = new Date(startDate);
      if (endDate) periodQuery.date.$lte = new Date(endDate);
    }

    const [accounts, categories, budgets, transactions, ledgerTransactions, totalTransactionCount] =
      await Promise.all([
        Account.find({ deletedAt: null }).sort({ createdAt: 1 }).lean(),
        Category.find({ deletedAt: null }).sort({ type: 1, name: 1 }).lean(),
        Budget.find({ deletedAt: null }).populate('category', 'name icon type color').lean(),
        Transaction.find(periodQuery)
          .populate('category', 'name icon type color')
          .populate('account', 'name icon')
          .populate('toAccount', 'name icon')
          .sort({ date: -1, createdAt: -1 })
          .lean(),
        Transaction.find({ deletedAt: null }).select('type amount account toAccount').lean(),
        Transaction.countDocuments({ deletedAt: null }),
      ]);

    const accountSummary = computeAccountSummaries(accounts, ledgerTransactions);

    return NextResponse.json({
      success: true,
      accounts: accountSummary.accounts.map(serializeAccount),
      categories: categories.map(serializeCategory),
      budgets: budgets.map(serializeBudget),
      transactions: transactions.map(serializeTransaction),
      stats: {
        totalAccountBalance: accountSummary.totalAccountBalance,
        totalTransactionCount,
        accountCount: accounts.length,
        categoryCount: categories.length,
      },
    });
  } catch (error) {
    console.error('Failed to fetch finance bootstrap:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch finance bootstrap data' },
      { status: 500 }
    );
  }
}
