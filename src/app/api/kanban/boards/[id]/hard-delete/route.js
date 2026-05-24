import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import KanbanBoard from '@/models/KanbanBoard';
import KanbanColumn from '@/models/KanbanColumn';
import KanbanCard from '@/models/KanbanCard';
import { requireAdminAuth } from '@/lib/money-auth';

export async function DELETE(req, { params }) {
  const { id } = await params;
  const authResult = await requireAdminAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    await dbConnect();

    const board = await KanbanBoard.findOne({ _id: id, deletedAt: { $ne: null } });
    if (!board) {
      return NextResponse.json({ error: 'Board not found in trash' }, { status: 404 });
    }

    await KanbanCard.deleteMany({ boardId: id });
    await KanbanColumn.deleteMany({ boardId: id });
    await KanbanBoard.findByIdAndDelete(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Kanban Hard Delete] Error:', error);
    return NextResponse.json(
      { error: 'Failed to permanently delete board', details: error.message },
      { status: 500 }
    );
  }
}
