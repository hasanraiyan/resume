import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import KanbanBoard from '@/models/KanbanBoard';
import KanbanColumn from '@/models/KanbanColumn';
import KanbanCard from '@/models/KanbanCard';
import { requireAdminAuth } from '@/lib/money-auth';

export async function GET(req, { params }) {
  const { id } = await params;
  const authResult = await requireAdminAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    await dbConnect();
    const board = await KanbanBoard.findOne({ _id: id, deletedAt: null }).lean();
    if (!board) return NextResponse.json({ error: 'Board not found' }, { status: 404 });

    const columns = await KanbanColumn.find({ boardId: id, deletedAt: null })
      .sort({ position: 1 })
      .lean();

    const cards = await KanbanCard.find({ boardId: id, deletedAt: null })
      .sort({ position: 1 })
      .lean();

    const exportData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      board: {
        name: board.name,
        description: board.description,
        color: board.color,
      },
      columns: columns.map((c) => ({
        title: c.title,
        color: c.color,
        position: c.position,
        wipLimit: c.wipLimit,
      })),
      cards: cards.map((c) => ({
        title: c.title,
        description: c.description,
        position: c.position,
        labels: c.labels,
        priority: c.priority,
        dueDate: c.dueDate,
        checklist: c.checklist,
        columnIndex: columns.findIndex((col) => col._id.toString() === c.columnId?.toString()),
      })),
    };

    return NextResponse.json(exportData);
  } catch (error) {
    console.error('[Kanban Export GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to export board', details: error.message },
      { status: 500 }
    );
  }
}
