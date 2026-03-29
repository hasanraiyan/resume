import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Transaction from '@/models/Transaction';

export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const account = searchParams.get('account');
    const category = searchParams.get('category');
    const type = searchParams.get('type');

    const query = {};
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    if (account) query.account = account;
    if (category) query.category = category;
    if (type) query.type = type;

    const transactions = await Transaction.find(query)
      .populate('category', 'name icon type')
      .populate('account', 'name icon')
      .populate('toAccount', 'name icon')
      .sort({ date: -1, createdAt: -1 })
      .lean();

    const serialized = transactions.map((t) => ({
      ...t,
      _id: t._id.toString(),
      id: t._id.toString(),
      category: t.category ? { ...t.category, _id: t.category._id.toString() } : null,
      account: { ...t.account, _id: t.account._id.toString() },
      toAccount: t.toAccount ? { ...t.toAccount, _id: t.toAccount._id.toString() } : null,
      date: t.date.toISOString(),
    }));

    return NextResponse.json({ success: true, transactions: serialized });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const transaction = new Transaction(body);
    await transaction.save();
    const populated = await Transaction.findById(transaction._id)
      .populate('category', 'name icon type')
      .populate('account', 'name icon')
      .populate('toAccount', 'name icon')
      .lean();

    const serialized = {
      ...populated,
      _id: populated._id.toString(),
      id: populated._id.toString(),
      category: populated.category
        ? { ...populated.category, _id: populated.category._id.toString() }
        : null,
      account: { ...populated.account, _id: populated.account._id.toString() },
      toAccount: populated.toAccount
        ? { ...populated.toAccount, _id: populated.toAccount._id.toString() }
        : null,
      date: populated.date.toISOString(),
    };

    return NextResponse.json({ success: true, transaction: serialized });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to create transaction' },
      { status: 500 }
    );
  }
}
