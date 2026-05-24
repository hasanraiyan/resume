import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import KanbanCard from '@/models/KanbanCard';
import KanbanColumn from '@/models/KanbanColumn';
import { requireAdminAuth } from '@/lib/money-auth';

export async function GET(req, { params }) {
  const { id: boardId } = await params;
  const authResult = await requireAdminAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    await dbConnect();

    const cards = await KanbanCard.find({ boardId, deletedAt: null }).sort({ position: 1 }).lean();

    return NextResponse.json({ cards });
  } catch (error) {
    console.error('[Kanban Cards GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cards', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req, { params }) {
  const { id: boardId } = await params;
  const authResult = await requireAdminAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    await dbConnect();
    const body = await req.json();

    if (!body.title?.trim()) {
      return NextResponse.json({ error: 'Card title is required' }, { status: 400 });
    }

    if (!body.columnId) {
      return NextResponse.json({ error: 'Column ID is required' }, { status: 400 });
    }

    const column = await KanbanColumn.findOne({ _id: body.columnId, boardId, deletedAt: null });
    if (!column) {
      return NextResponse.json({ error: 'Column not found' }, { status: 404 });
    }

    const maxPos = await KanbanCard.findOne({ columnId: body.columnId, deletedAt: null })
      .sort({ position: -1 })
      .select('position')
      .lean();

    const card = await KanbanCard.create({
      boardId,
      columnId: body.columnId,
      title: body.title.trim(),
      description: body.description?.trim() || '',
      position: (maxPos?.position ?? -1) + 1,
      labels: body.labels || [],
      priority: body.priority || 'medium',
      dueDate: body.dueDate || null,
      checklist: body.checklist || [],
    });

    return NextResponse.json({ card }, { status: 201 });
  } catch (error) {
    console.error('[Kanban Cards POST] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create card', details: error.message },
      { status: 500 }
    );
  }
}
