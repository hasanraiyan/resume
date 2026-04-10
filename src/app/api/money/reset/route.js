import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Account from '@/models/Account';
import Category from '@/models/Category';
import Transaction from '@/models/Transaction';
import { serializeAccount, serializeCategory } from '@/lib/money-serializers';
import { requireUserAuth } from '@/lib/money-auth';

export async function POST() {
  const session = await requireUserAuth();
  if (typeof session !== 'object') return session;

  try {
    await dbConnect();
    const resetAt = new Date();
    const userId = session.user.id;

    await Promise.all([
      Account.updateMany(
        { deletedAt: null, userId },
        { $set: { deletedAt: resetAt }, $inc: { syncVersion: 1 } }
      ),
      Category.updateMany(
        { deletedAt: null, userId },
        { $set: { deletedAt: resetAt }, $inc: { syncVersion: 1 } }
      ),
      Transaction.updateMany(
        { deletedAt: null, userId },
        { $set: { deletedAt: resetAt }, $inc: { syncVersion: 1 } }
      ),
    ]);

    // Seed fresh default accounts
    const accounts = await Account.insertMany([
      { userId, name: 'CARD', icon: 'credit-card', initialBalance: 0 },
      { userId, name: 'CASH', icon: 'wallet', initialBalance: 0 },
      { userId, name: 'SAVING', icon: 'piggy-bank', initialBalance: 0 },
    ]);

    // Seed default categories
    const expenseCategories = await Category.insertMany([
      {
        userId,
        name: 'Food & Dining',
        type: 'expense',
        icon: 'utensils',
        color: '#EF4444',
        bgColor: '#E6F4EA',
      },
      {
        userId,
        name: 'Transportation',
        type: 'expense',
        icon: 'car',
        color: '#F59E0B',
        bgColor: '#E6F4EA',
      },
      {
        userId,
        name: 'Shopping',
        type: 'expense',
        icon: 'shopping-bag',
        color: '#8B5CF6',
        bgColor: '#E6F4EA',
      },
      {
        userId,
        name: 'Bills & Utilities',
        type: 'expense',
        icon: 'receipt',
        color: '#3B82F6',
        bgColor: '#E6F4EA',
      },
      {
        userId,
        name: 'Entertainment',
        type: 'expense',
        icon: 'film',
        color: '#EC4899',
        bgColor: '#E6F4EA',
      },
      {
        userId,
        name: 'Health',
        type: 'expense',
        icon: 'heart-pulse',
        color: '#10B981',
        bgColor: '#E6F4EA',
      },
      {
        userId,
        name: 'Social',
        type: 'expense',
        icon: 'users',
        color: '#6366F1',
        bgColor: '#E6F4EA',
      },
      {
        userId,
        name: 'Education',
        type: 'expense',
        icon: 'book-open',
        color: '#14B8A6',
        bgColor: '#E6F4EA',
      },
    ]);

    const incomeCategories = await Category.insertMany([
      {
        userId,
        name: 'Salary',
        type: 'income',
        icon: 'briefcase',
        color: '#22C55E',
        bgColor: '#E6F4EA',
      },
      {
        userId,
        name: 'Freelance',
        type: 'income',
        icon: 'laptop',
        color: '#06B6D4',
        bgColor: '#E6F4EA',
      },
      {
        userId,
        name: 'Awards',
        type: 'income',
        icon: 'trophy',
        color: '#F59E0B',
        bgColor: '#E6F4EA',
      },
      { userId, name: 'Sale', type: 'income', icon: 'tag', color: '#A855F7', bgColor: '#E6F4EA' },
      {
        userId,
        name: 'Interest',
        type: 'income',
        icon: 'trending-up',
        color: '#0EA5E9',
        bgColor: '#E6F4EA',
      },
    ]);

    return NextResponse.json({
      success: true,
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
