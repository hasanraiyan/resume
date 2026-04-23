import { NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/money-auth';
import { updateAccount, deleteAccount } from '@/lib/apps/pocketly/service/service';

export async function PUT(request, { params }) {
  const session = await requireAdminAuth();
  if (typeof session !== 'object') return session;

  try {
    const { id } = await params;
    const body = await request.json();
    const account = await updateAccount(id, body);

    return NextResponse.json({
      success: true,
      account: account,
    });
  } catch (error) {
    if (error.message === 'Not found' || error.message === 'Account not found') {
      return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(
      { success: false, message: 'Failed to update account' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  const session = await requireAdminAuth();
  if (typeof session !== 'object') return session;

  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, message: 'Missing id' }, { status: 400 });
    }
    const deleted = await deleteAccount(id);
    if (!deleted) {
      return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to delete account' },
      { status: 500 }
    );
  }
}
