import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import KanbanBoard from '@/models/KanbanBoard';
import KanbanColumn from '@/models/KanbanColumn';
import KanbanCard from '@/models/KanbanCard';
import KanbanActivity from '@/models/KanbanActivity';
import { requireAdminAuth } from '@/lib/money-auth';

export async function POST(req, { params }) {
  const { id } = await params;
  const authResult = await requireAdminAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    await dbConnect();
    const source = await KanbanBoard.findOne({ _id: id, deletedAt: null }).lean();
    if (!source) return NextResponse.json({ error: 'Board not found' }, { status: 404 });

    const maxPos = await KanbanBoard.findOne({ deletedAt: null })
      .sort({ position: -1 })
      .select('position')
      .lean();

    const board = await KanbanBoard.create({
      name: `${source.name} (Copy)`,
      description: source.description,
      color: source.color,
      position: (maxPos?.position ?? -1) + 1,
    });

    const sourceColumns = await KanbanColumn.find({ boardId: id, deletedAt: null })
      .sort({ position: 1 })
      .lean();

    const colIdMap = {};
    const cols = await KanbanColumn.insertMany(
      sourceColumns.map((col) => {
        const newCol = {
          boardId: board._id,
          title: col.title,
          color: col.color,
          position: col.position,
          wipLimit: col.wipLimit,
        };
        return newCol;
      })
    );
    sourceColumns.forEach((oldCol, i) => {
      colIdMap[oldCol._id.toString()] = cols[i]._id;
    });

    const sourceCards = await KanbanCard.find({ boardId: id, deletedAt: null })
      .sort({ position: 1 })
      .lean();

    if (sourceCards.length > 0) {
      await KanbanCard.insertMany(
        sourceCards.map((card) => ({
          boardId: board._id,
          columnId: colIdMap[card.columnId?.toString()] || cols[0]._id,
          title: card.title,
          description: card.description,
          position: card.position,
          labels: card.labels,
          priority: card.priority,
          dueDate: card.dueDate,
          checklist: card.checklist,
          number: null,
        }))
      );
    }

    await KanbanActivity.create({
      boardId: board._id,
      action: 'board_duplicated',
      details: `Duplicated from "${source.name}"`,
    });

    return NextResponse.json({ board }, { status: 201 });
  } catch (error) {
    console.error('[Kanban Duplicate POST] Error:', error);
    return NextResponse.json(
      { error: 'Failed to duplicate board', details: error.message },
      { status: 500 }
    );
  }
}
