import { NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/money-auth';
import { getCategories, createCategory } from '@/lib/apps/pocketly/service/service';

export async function GET() {
  const session = await requireAdminAuth();
  if (typeof session !== 'object') return session;

  try {
    const categories = await getCategories();
    return NextResponse.json({ success: true, categories: categories });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const session = await requireAdminAuth();
  if (typeof session !== 'object') return session;

  try {
    const body = await request.json();
    const category = await createCategory(body);
    return NextResponse.json({
      success: true,
      category: category,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to create category' },
      { status: 500 }
    );
  }
}
