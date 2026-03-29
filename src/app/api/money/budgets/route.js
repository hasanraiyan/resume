import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Budget from '@/models/Budget';
import { serializeBudget } from '@/lib/money-serializers';

export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    const query = { deletedAt: null };
    if (month) query.month = parseInt(month);
    if (year) query.year = parseInt(year);

    const budgets = await Budget.find(query)
      .populate('category', 'name icon type color')
      .sort({ year: -1, month: -1 })
      .lean();

    const serialized = budgets.map(serializeBudget);

    return NextResponse.json({ success: true, budgets: serialized });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to fetch budgets' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const budget = new Budget(body);
    await budget.save();
    const populated = await Budget.findById(budget._id)
      .populate('category', 'name icon type color')
      .lean();

    const serialized = serializeBudget(populated);

    return NextResponse.json({ success: true, budget: serialized });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to create budget' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { _id, ...update } = body;
    const budget = await Budget.findByIdAndUpdate(
      _id || body.id,
      { $set: { ...update, deletedAt: null }, $inc: { syncVersion: 1 } },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    )
      .populate('category', 'name icon type color')
      .lean();

    const serialized = serializeBudget(budget);

    return NextResponse.json({ success: true, budget: serialized });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to save budget' }, { status: 500 });
  }
}
