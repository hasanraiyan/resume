import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import KanbanBoard from '@/models/KanbanBoard';
import { requireAdminAuth } from '@/lib/money-auth';

export async function GET(req) {
  const authResult = await requireAdminAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    await dbConnect();
    const boards = await KanbanBoard.find({ deletedAt: { $ne: null } })
      .sort({ deletedAt: -1 })
      .lean();

    return NextResponse.json({ boards });
  } catch (error) {
    console.error('[Kanban Trash GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trash', details: error.message },
      { status: 500 }
    );
  }
}
