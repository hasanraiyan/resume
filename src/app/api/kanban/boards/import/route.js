import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import KanbanBoard from '@/models/KanbanBoard';
import KanbanColumn from '@/models/KanbanColumn';
import KanbanCard from '@/models/KanbanCard';
import { requireAdminAuth } from '@/lib/money-auth';

export async function POST(req) {
  const authResult = await requireAdminAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    await dbConnect();
    const body = await req.json();

    if (!body.board?.name?.trim()) {
      return NextResponse.json({ error: 'Board name is required' }, { status: 400 });
    }

    const maxPos = await KanbanBoard.findOne({ deletedAt: null })
      .sort({ position: -1 })
      .select('position')
      .lean();

    const board = await KanbanBoard.create({
      name: body.board.name.trim(),
      description: body.board.description?.trim() || '',
      color: body.board.color || '#1f644e',
      position: (maxPos?.position ?? -1) + 1,
    });

    if (body.columns?.length > 0) {
      const columnDocMap = {};
      const cols = await KanbanColumn.insertMany(
        body.columns.map((col, i) => {
          const doc = {
            boardId: board._id,
            title: col.title || `Column ${i + 1}`,
            color: col.color || '#e5e3d8',
            position: col.position ?? i,
            wipLimit: col.wipLimit || null,
          };
          return doc;
        })
      );
      cols.forEach((doc, i) => {
        columnDocMap[i] = doc._id;
      });

      if (body.cards?.length > 0) {
        await KanbanCard.insertMany(
          body.cards.map((card) => ({
            boardId: board._id,
            columnId: columnDocMap[card.columnIndex] || cols[0]._id,
            title: card.title || 'Untitled',
            description: card.description || '',
            position: card.position ?? 0,
            labels: card.labels || [],
            priority: card.priority || 'medium',
            dueDate: card.dueDate || null,
            checklist: card.checklist || [],
          }))
        );
      }
    } else {
      const defaultColumns = ['To Do', 'In Progress', 'Done'];
      await KanbanColumn.insertMany(
        defaultColumns.map((title, i) => ({
          boardId: board._id,
          title,
          position: i,
        }))
      );
    }

    return NextResponse.json({ board }, { status: 201 });
  } catch (error) {
    console.error('[Kanban Import POST] Error:', error);
    return NextResponse.json(
      { error: 'Failed to import board', details: error.message },
      { status: 500 }
    );
  }
}
