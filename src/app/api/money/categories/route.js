import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Category from '@/models/Category';

export async function GET() {
  try {
    await dbConnect();
    const categories = await Category.find({}).sort({ type: 1, name: 1 }).lean();
    const serialized = categories.map((c) => ({
      ...c,
      _id: c._id.toString(),
      id: c._id.toString(),
    }));
    return NextResponse.json({ success: true, categories: serialized });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const category = new Category(body);
    await category.save();
    const obj = category.toObject();
    return NextResponse.json({
      success: true,
      category: { ...obj, _id: obj._id.toString(), id: obj._id.toString() },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to create category' },
      { status: 500 }
    );
  }
}
