import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Account from '@/models/Account';
import Category from '@/models/Category';
import Transaction from '@/models/Transaction';
import FinanceSyncState from '@/models/FinanceSyncState';
import { serializeAccount, serializeCategory } from '@/lib/money-serializers';

async function getSyncState() {
  let state = await FinanceSyncState.findOne({ key: 'singleton' });
  if (!state) {
    state = await FinanceSyncState.create({ key: 'singleton', resetVersion: 0, resetAt: null });
  }
  return state;
}

export async function POST() {
  try {
    await dbConnect();

    const state = await getSyncState();
    const resetAt = new Date();
    const nextResetVersion = (state.resetVersion || 0) + 1;

    await Promise.all([
      Account.updateMany(
        { deletedAt: null },
        { $set: { deletedAt: resetAt }, $inc: { syncVersion: 1 } }
      ),
      Category.updateMany(
        { deletedAt: null },
        { $set: { deletedAt: resetAt }, $inc: { syncVersion: 1 } }
      ),
      Transaction.updateMany(
        { deletedAt: null },
        { $set: { deletedAt: resetAt }, $inc: { syncVersion: 1 } }
      ),
      FinanceSyncState.updateOne(
        { key: 'singleton' },
        { $set: { resetVersion: nextResetVersion, resetAt } },
        { upsert: true }
      ),
    ]);

    // Seed fresh default accounts
    const accounts = await Account.insertMany([
      { name: 'CARD', icon: 'credit-card', initialBalance: 0 },
      { name: 'CASH', icon: 'wallet', initialBalance: 0 },
      { name: 'SAVING', icon: 'piggy-bank', initialBalance: 0 },
    ]);

    // Seed default categories
    const expenseCategories = await Category.insertMany([
      { name: 'Food & Dining', type: 'expense', icon: 'utensils', color: '#EF4444' },
      { name: 'Transportation', type: 'expense', icon: 'car', color: '#F59E0B' },
      { name: 'Shopping', type: 'expense', icon: 'shopping-bag', color: '#8B5CF6' },
      { name: 'Bills & Utilities', type: 'expense', icon: 'receipt', color: '#3B82F6' },
      { name: 'Entertainment', type: 'expense', icon: 'film', color: '#EC4899' },
      { name: 'Health', type: 'expense', icon: 'heart-pulse', color: '#10B981' },
      { name: 'Social', type: 'expense', icon: 'users', color: '#6366F1' },
      { name: 'Education', type: 'expense', icon: 'book-open', color: '#14B8A6' },
    ]);

    const incomeCategories = await Category.insertMany([
      { name: 'Salary', type: 'income', icon: 'briefcase', color: '#22C55E' },
      { name: 'Freelance', type: 'income', icon: 'laptop', color: '#06B6D4' },
      { name: 'Awards', type: 'income', icon: 'trophy', color: '#F59E0B' },
      { name: 'Sale', type: 'income', icon: 'tag', color: '#A855F7' },
      { name: 'Interest', type: 'income', icon: 'trending-up', color: '#0EA5E9' },
    ]);

    return NextResponse.json({
      success: true,
      syncState: {
        resetVersion: nextResetVersion,
        resetAt: resetAt.toISOString(),
      },
      accounts: accounts.map((a) => serializeAccount(a.toObject())),
      categories: [...expenseCategories, ...incomeCategories].map((c) =>
        serializeCategory(c.toObject())
      ),
    });
  } catch (error) {
    console.error('Finance reset failed:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to clear finance data' },
      { status: 500 }
    );
  }
}
