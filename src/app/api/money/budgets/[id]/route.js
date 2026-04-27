import { NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/money-auth';
import { updateBudget, deleteBudget } from '@/lib/apps/pocketly/service/service';

export async function PUT(request, { params }) {
  const session = await requireAdminAuth(request);
  if (typeof session !== 'object') return session;

  try {
    const body = await request.json();
    const { id } = await params;
    const budget = await updateBudget(id, body);
    return NextResponse.json({ success: true, budget });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to update budget', errors: error.errors },
      { status: 400 }
    );
  }
}

export async function DELETE(request, { params }) {
  const session = await requireAdminAuth(request);
  if (typeof session !== 'object') return session;

  try {
    const { id } = await params;
    await deleteBudget(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to delete budget' },
      { status: 500 }
    );
  }
}
