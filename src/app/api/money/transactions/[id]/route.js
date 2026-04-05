import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Transaction from '@/models/Transaction';
import { serializeTransaction } from '@/lib/money-serializers';
import { requireAdminAuth } from '@/lib/money-auth';

export async function DELETE(request, { params }) {
  const session = await requireAdminAuth();
  if (typeof session !== 'object') return session;

  try {
    await dbConnect();
    const { id } = await params;
    await Transaction.findByIdAndUpdate(id, {
      $set: { deletedAt: new Date() },
      $inc: { syncVersion: 1 },
    });
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
    await dbConnect();
    const { id } = await params;
    const body = await request.json();
    const transaction = await Transaction.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { $set: body, $inc: { syncVersion: 1 } },
      { new: true }
    )
      .populate('category', 'name icon type')
      .populate('account', 'name icon')
      .populate('toAccount', 'name icon')
      .lean();
    if (!transaction)
      return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    const serialized = serializeTransaction(transaction);
    return NextResponse.json({ success: true, transaction: serialized });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to update transaction' },
      { status: 500 }
    );
  }
}
