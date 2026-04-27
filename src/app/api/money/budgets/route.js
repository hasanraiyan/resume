import { NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/money-auth';
import { getBudgets, createBudget } from '@/lib/apps/pocketly/service/service';

export async function GET(request) {
  const session = await requireAdminAuth(request);
  if (typeof session !== 'object') return session;

  try {
    const budgets = await getBudgets();
    return NextResponse.json({ success: true, budgets });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to fetch budgets' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const session = await requireAdminAuth(request);
  if (typeof session !== 'object') return session;

  try {
    const body = await request.json();
    const budget = await createBudget(body);
    return NextResponse.json({ success: true, budget });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to create budget', errors: error.errors },
      { status: 400 }
    );
  }
}
