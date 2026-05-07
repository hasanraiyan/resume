import { NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/money-auth';
import { updateSavingsGoal, deleteSavingsGoal } from '@/lib/apps/pocketly/service/service';

export async function PUT(request, { params }) {
  const session = await requireAdminAuth(request);
  if (typeof session !== 'object') return session;

  try {
    const { id } = await params;
    const body = await request.json();
    const goal = await updateSavingsGoal(id, body);
    return NextResponse.json({ success: true, goal });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const session = await requireAdminAuth(request);
  if (typeof session !== 'object') return session;

  try {
    const { id } = await params;
    const success = await deleteSavingsGoal(id);
    return NextResponse.json({ success });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
