import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Account from '@/models/Account';

export async function PUT(request, { params }) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await request.json();
    const account = await Account.findByIdAndUpdate(id, body, { new: true }).lean();
    if (!account)
      return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    return NextResponse.json({
      success: true,
      account: { ...account, _id: account._id.toString(), id: account._id.toString() },
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
    await Account.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to delete account' },
      { status: 500 }
    );
  }
}
