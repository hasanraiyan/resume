import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Account from '@/models/Account';
import { serializeAccount } from '@/lib/money-serializers';

export async function PUT(request, { params }) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await request.json();
    const account = await Account.findOneAndUpdate(
      { _id: id, deletedAt: null },
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
  try {
    await dbConnect();
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, message: 'Missing id' }, { status: 400 });
    }
    await Account.deleteOne({ _id: id });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to delete account' },
      { status: 500 }
    );
  }
}
