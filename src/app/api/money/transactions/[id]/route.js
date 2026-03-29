import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Transaction from '@/models/Transaction';

export async function DELETE(request, { params }) {
  try {
    await dbConnect();
    const { id } = await params;
    await Transaction.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to delete transaction' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await request.json();
    const transaction = await Transaction.findByIdAndUpdate(id, body, { new: true })
      .populate('category', 'name icon type')
      .populate('account', 'name icon')
      .populate('toAccount', 'name icon')
      .lean();
    if (!transaction)
      return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    const serialized = {
      ...transaction,
      _id: transaction._id.toString(),
      id: transaction._id.toString(),
      category: transaction.category
        ? { ...transaction.category, _id: transaction.category._id.toString() }
        : null,
      account: { ...transaction.account, _id: transaction.account._id.toString() },
      toAccount: transaction.toAccount
        ? { ...transaction.toAccount, _id: transaction.toAccount._id.toString() }
        : null,
      date: transaction.date.toISOString(),
    };
    return NextResponse.json({ success: true, transaction: serialized });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to update transaction' },
      { status: 500 }
    );
  }
}
