import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Account from '@/models/Account';
import { serializeAccount } from '@/lib/money-serializers';
import { requireUserAuth } from '@/lib/money-auth';

export async function PUT(request, { params }) {
  const session = await requireUserAuth();
  if (typeof session !== 'object') return session;

  try {
    await dbConnect();
    const { id } = await params;
    const body = await request.json();
    delete body.userId;
    const account = await Account.findOneAndUpdate(
      { _id: id, deletedAt: null, userId: session.user.id },
      { $set: body, $inc: { syncVersion: 1 } },
      { new: true }
    ).lean();
    if (!account)
      return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    return NextResponse.json({
      success: true,
      account: serializeAccount(account),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to update account' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  const session = await requireUserAuth();
  if (typeof session !== 'object') return session;

  try {
    await dbConnect();
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, message: 'Missing id' }, { status: 400 });
    }
    const account = await Account.findOneAndUpdate(
      { _id: id, userId: session.user.id },
      {
        $set: { deletedAt: new Date() },
        $inc: { syncVersion: 1 },
      }
    );
    if (!account)
      return NextResponse.json(
        { success: false, message: 'Not found or unauthorized' },
        { status: 404 }
      );
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to delete account' },
      { status: 500 }
    );
  }
}
