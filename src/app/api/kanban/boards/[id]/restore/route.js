import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import KanbanBoard from '@/models/KanbanBoard';
import KanbanColumn from '@/models/KanbanColumn';
import KanbanCard from '@/models/KanbanCard';
import { requireAdminAuth } from '@/lib/money-auth';

export async function PUT(req, { params }) {
  const { id } = await params;
  const authResult = await requireAdminAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    await dbConnect();

    const board = await KanbanBoard.findOne({ _id: id, deletedAt: { $ne: null } });
    if (!board) {
      return NextResponse.json({ error: 'Board not found in trash' }, { status: 404 });
    }

    board.deletedAt = null;
    board.syncVersion += 1;
    await board.save();

    await KanbanColumn.updateMany(
      { boardId: id, deletedAt: { $ne: null } },
      { deletedAt: null, $inc: { syncVersion: 1 } }
    );

    await KanbanCard.updateMany(
      { boardId: id, deletedAt: { $ne: null } },
      { deletedAt: null, $inc: { syncVersion: 1 } }
    );

    return NextResponse.json({ board });
  } catch (error) {
    console.error('[Kanban Restore PUT] Error:', error);
    return NextResponse.json(
      { error: 'Failed to restore board', details: error.message },
      { status: 500 }
    );
  }
}
