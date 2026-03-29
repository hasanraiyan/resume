import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Account from '@/models/Account';
import Category from '@/models/Category';
import Transaction from '@/models/Transaction';
import Budget from '@/models/Budget';
import {
  serializeAccount,
  serializeBudget,
  serializeCategory,
  serializeTransaction,
} from '@/lib/money-serializers';

function buildChangeQuery(since) {
  if (!since) {
    return {};
  }
  return { updatedAt: { $gt: new Date(since) } };
}

export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const since = searchParams.get('since');
    const query = buildChangeQuery(since);

    const [accounts, categories, transactions, budgets] = await Promise.all([
      Account.find(query).sort({ updatedAt: 1 }).lean(),
      Category.find(query).sort({ updatedAt: 1 }).lean(),
      Transaction.find(query)
        .populate('category', 'name icon type color')
        .populate('account', 'name icon')
        .populate('toAccount', 'name icon')
        .sort({ updatedAt: 1 })
        .lean(),
      Budget.find(query).populate('category', 'name icon type color').sort({ updatedAt: 1 }).lean(),
    ]);

    return NextResponse.json({
      success: true,
      changes: {
        accounts: accounts.map(serializeAccount),
        categories: categories.map(serializeCategory),
        transactions: transactions.map(serializeTransaction),
        budgets: budgets.map(serializeBudget),
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
