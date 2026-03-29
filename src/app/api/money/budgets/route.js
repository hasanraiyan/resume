import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Budget from '@/models/Budget';

export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    const query = {};
    if (month) query.month = parseInt(month);
    if (year) query.year = parseInt(year);

    const budgets = await Budget.find(query)
      .populate('category', 'name icon type color')
      .sort({ year: -1, month: -1 })
      .lean();

    const serialized = budgets.map((b) => ({
      ...b,
      _id: b._id.toString(),
      id: b._id.toString(),
      category: { ...b.category, _id: b.category._id.toString() },
    }));

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

    const serialized = {
      ...populated,
      _id: populated._id.toString(),
      id: populated._id.toString(),
      category: { ...populated.category, _id: populated.category._id.toString() },
    };

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
    const budget = await Budget.findByIdAndUpdate(_id || body.id, update, {
      new: true,
      upsert: true,
    })
      .populate('category', 'name icon type color')
      .lean();

    const serialized = {
      ...budget,
      _id: budget._id.toString(),
      id: budget._id.toString(),
      category: { ...budget.category, _id: budget.category._id.toString() },
    };

    return NextResponse.json({ success: true, budget: serialized });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to save budget' }, { status: 500 });
  }
}
