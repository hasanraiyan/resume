import { NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/money-auth';
import { updateCategory, deleteCategory } from '@/lib/apps/pocketly/service/service';

export async function PUT(request, { params }) {
  const session = await requireAdminAuth();
  if (typeof session !== 'object') return session;

  try {
    const { id } = await params;
    const body = await request.json();
    const category = await updateCategory(id, body);

    return NextResponse.json({
      success: true,
      category: category,
    });
  } catch (error) {
    if (error.message === 'Category not found') {
       return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(
      { success: false, message: 'Failed to update category' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  const session = await requireAdminAuth();
  if (typeof session !== 'object') return session;

  try {
    const { id } = await params;
    await deleteCategory(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to delete category' },
      { status: 500 }
    );
  }
}
