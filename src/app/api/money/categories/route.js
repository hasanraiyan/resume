import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Category from '@/models/Category';
import { serializeCategory } from '@/lib/money-serializers';

export async function GET() {
  try {
    await dbConnect();
    const categories = await Category.find({ deletedAt: null }).sort({ type: 1, name: 1 }).lean();
    const serialized = categories.map(serializeCategory);
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
      category: serializeCategory(obj),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to create category' },
      { status: 500 }
    );
  }
}
