import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import KanbanActivity from '@/models/KanbanActivity';
import { requireAdminAuth } from '@/lib/money-auth';

export async function GET(req, { params }) {
  const { id } = await params;
  const authResult = await requireAdminAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    await dbConnect();
    const activities = await KanbanActivity.find({ boardId: id })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return NextResponse.json({ activities });
  } catch (error) {
    console.error('[Kanban Activity GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity', details: error.message },
      { status: 500 }
    );
  }
}
