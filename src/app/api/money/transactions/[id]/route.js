import { NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/money-auth';
import { updateTransaction, deleteTransaction } from '@/lib/apps/pocketly/service/service';

export async function DELETE(request, { params }) {
  const session = await requireAdminAuth();
  if (typeof session !== 'object') return session;

  try {
    const { id } = await params;
    const deleted = await deleteTransaction(id);
    if (!deleted) {
      return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to delete transaction' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  const session = await requireAdminAuth();
  if (typeof session !== 'object') return session;

  try {
    const { id } = await params;
    const body = await request.json();
    const transaction = await updateTransaction(id, body);
    return NextResponse.json({ success: true, transaction: transaction });
  } catch (error) {
    if (error.message === 'Transaction not found') {
      return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(
      { success: false, message: 'Failed to update transaction' },
      { status: 500 }
    );
  }
}
