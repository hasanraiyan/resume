import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Account from '@/models/Account';
import Category from '@/models/Category';
import Transaction from '@/models/Transaction';
import FinanceSyncState from '@/models/FinanceSyncState';
import { serializeAccount, serializeCategory, serializeTransaction } from '@/lib/money-serializers';
import { requireAdminAuth } from '@/lib/money-auth';

function buildChangeQuery(since) {
  if (!since) {
    return {};
  }
  return { updatedAt: { $gt: new Date(since) } };
}

export async function GET(request) {
  const session = await requireAdminAuth();
  if (typeof session !== 'object') return session;

  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const since = searchParams.get('since');
    const query = buildChangeQuery(since);

    let syncState = await FinanceSyncState.findOne({ key: 'singleton' }).lean();
    if (!syncState) {
      syncState = { resetVersion: 0, resetAt: null };
    }

    const [accounts, categories, transactions] = await Promise.all([
      Account.find(query).sort({ updatedAt: 1 }).lean(),
      Category.find(query).sort({ updatedAt: 1 }).lean(),
      Transaction.find(query)
        .populate('category', 'name icon type color')
        .populate('account', 'name icon')
        .populate('toAccount', 'name icon')
        .sort({ updatedAt: 1 })
        .lean(),
    ]);

    return NextResponse.json({
      success: true,
      changes: {
        accounts: accounts.map(serializeAccount),
        categories: categories.map(serializeCategory),
        transactions: transactions.map(serializeTransaction),
      },
      syncState: {
        resetVersion: syncState.resetVersion || 0,
        resetAt: syncState.resetAt ? new Date(syncState.resetAt).toISOString() : null,
      },
      serverTime: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Finance sync pull failed:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to pull finance changes' },
      { status: 500 }
    );
  }
}
