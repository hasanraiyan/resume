import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Account from '@/models/Account';
import Category from '@/models/Category';
import Transaction from '@/models/Transaction';
import Budget from '@/models/Budget';
import FinanceSyncState from '@/models/FinanceSyncState';

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
      Budget.updateMany(
        { deletedAt: null },
        { $set: { deletedAt: resetAt }, $inc: { syncVersion: 1 } }
      ),
      FinanceSyncState.updateOne(
        { key: 'singleton' },
        { $set: { resetVersion: nextResetVersion, resetAt } },
        { upsert: true }
      ),
    ]);

    return NextResponse.json({
      success: true,
      syncState: {
        resetVersion: nextResetVersion,
        resetAt: resetAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Finance reset failed:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to clear finance data' },
      { status: 500 }
    );
  }
}
