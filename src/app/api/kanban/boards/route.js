import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import KanbanBoard from '@/models/KanbanBoard';
import KanbanColumn from '@/models/KanbanColumn';
import KanbanCard from '@/models/KanbanCard';
import { requireAdminAuth } from '@/lib/money-auth';

export async function GET(req) {
  const authResult = await requireAdminAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    await dbConnect();
    const boards = await KanbanBoard.find({ deletedAt: null })
      .sort({ position: 1, createdAt: -1 })
      .lean();

    return NextResponse.json({ boards });
  } catch (error) {
    console.error('[Kanban Boards GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch boards', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  const authResult = await requireAdminAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    await dbConnect();
    const body = await req.json();

    if (!body.name?.trim()) {
      return NextResponse.json({ error: 'Board name is required' }, { status: 400 });
    }

    const maxPos = await KanbanBoard.findOne({ deletedAt: null })
      .sort({ position: -1 })
      .select('position')
      .lean();

    const board = await KanbanBoard.create({
      name: body.name.trim(),
      description: body.description?.trim() || '',
      color: body.color || '#1f644e',
      position: (maxPos?.position ?? -1) + 1,
    });

    const defaultColumns = ['To Do', 'In Progress', 'Done'];
    await KanbanColumn.insertMany(
      defaultColumns.map((title, i) => ({
        boardId: board._id,
        title,
        position: i,
      }))
    );

    return NextResponse.json({ board }, { status: 201 });
  } catch (error) {
    console.error('[Kanban Boards POST] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create board', details: error.message },
      { status: 500 }
    );
  }
}
