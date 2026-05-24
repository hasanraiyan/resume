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
    if (!board) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 });
    }

    const columns = await KanbanColumn.find({ boardId: id, deletedAt: null })
      .sort({ position: 1 })
      .lean();

    const cards = await KanbanCard.find({ boardId: id, deletedAt: null })
      .sort({ position: 1 })
      .lean();

    return NextResponse.json({ board, columns, cards });
  } catch (error) {
    console.error('[Kanban Board GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch board', details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(req, { params }) {
  const { id } = await params;
  const authResult = await requireAdminAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    await dbConnect();
    const body = await req.json();

    const board = await KanbanBoard.findOne({ _id: id, deletedAt: null });
    if (!board) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 });
    }

    if (body.name !== undefined) board.name = body.name.trim();
    if (body.description !== undefined) board.description = body.description.trim();
    if (body.color !== undefined) board.color = body.color;
    board.syncVersion += 1;
    await board.save();

    return NextResponse.json({ board });
  } catch (error) {
    console.error('[Kanban Board PUT] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update board', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  const { id } = await params;
  const authResult = await requireAdminAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    await dbConnect();

    const board = await KanbanBoard.findOne({ _id: id, deletedAt: null });
    if (!board) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 });
    }

    board.deletedAt = new Date();
    board.syncVersion += 1;
    await board.save();

    await KanbanColumn.updateMany(
      { boardId: id, deletedAt: null },
      { deletedAt: new Date(), $inc: { syncVersion: 1 } }
    );

    await KanbanCard.updateMany(
      { boardId: id, deletedAt: null },
      { deletedAt: new Date(), $inc: { syncVersion: 1 } }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Kanban Board DELETE] Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete board', details: error.message },
      { status: 500 }
    );
  }
}
