import { NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/money-auth';
import { getSavingsGoals, createSavingsGoal } from '@/lib/apps/pocketly/service/service';

export async function GET(request) {
  const session = await requireAdminAuth(request);
  if (typeof session !== 'object') return session;

  try {
    const goals = await getSavingsGoals();
    return NextResponse.json({ success: true, goals });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to fetch goals' }, { status: 500 });
  }
}

export async function POST(request) {
  const session = await requireAdminAuth(request);
  if (typeof session !== 'object') return session;

  try {
    const body = await request.json();
    const goal = await createSavingsGoal(body);
    return NextResponse.json({ success: true, goal });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to create goal' }, { status: 500 });
  }
}
