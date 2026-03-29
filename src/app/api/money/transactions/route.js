import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Transaction from '@/models/Transaction';
import { serializeTransaction } from '@/lib/money-serializers';

export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const account = searchParams.get('account');
    const category = searchParams.get('category');
    const type = searchParams.get('type');

    const query = { deletedAt: null };
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

    const serialized = transactions.map(serializeTransaction);

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

    const serialized = serializeTransaction(populated);

    return NextResponse.json({ success: true, transaction: serialized });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to create transaction' },
      { status: 500 }
    );
  }
}
