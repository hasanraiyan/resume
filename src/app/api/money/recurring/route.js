import { NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/money-auth';
import {
  getRecurringTransactions,
  createRecurringTransaction,
} from '@/lib/apps/pocketly/service/service';

export async function GET(request) {
  const session = await requireAdminAuth(request);
  if (typeof session !== 'object') return session;

  try {
    const recurring = await getRecurringTransactions();
    return NextResponse.json({ success: true, recurring });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to fetch recurring transactions' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const session = await requireAdminAuth(request);
  if (typeof session !== 'object') return session;

  try {
    const body = await request.json();
    const recurring = await createRecurringTransaction(body);
    return NextResponse.json({ success: true, recurring });
  } catch (error) {
    console.error('Recurring creation error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create recurring transaction' },
      { status: 500 }
    );
  }
}
