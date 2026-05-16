import { NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/money-auth';
import { deleteRecurringTransaction } from '@/lib/apps/pocketly/service/service';

export async function DELETE(request, { params }) {
  const session = await requireAdminAuth(request);
  if (typeof session !== 'object') return session;

  try {
    const { id } = await params;
    const success = await deleteRecurringTransaction(id);
    return NextResponse.json({ success });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
