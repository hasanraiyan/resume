import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import KanbanColumn from '@/models/KanbanColumn';
import KanbanCard from '@/models/KanbanCard';
import { requireAdminAuth } from '@/lib/money-auth';

export async function GET(req, { params }) {
  const { id: boardId } = await params;
  const authResult = await requireAdminAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    await dbConnect();

    const columns = await KanbanColumn.find({ boardId, deletedAt: null })
      .sort({ position: 1 })
      .lean();

    return NextResponse.json({ columns });
  } catch (error) {
    console.error('[Kanban Columns GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch columns', details: error.message },
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
      return NextResponse.json({ error: 'Column title is required' }, { status: 400 });
    }

    const maxPos = await KanbanColumn.findOne({ boardId, deletedAt: null })
      .sort({ position: -1 })
      .select('position')
      .lean();

    const column = await KanbanColumn.create({
      boardId,
      title: body.title.trim(),
      color: body.color || '#e5e3d8',
      position: (maxPos?.position ?? -1) + 1,
    });

    return NextResponse.json({ column }, { status: 201 });
  } catch (error) {
    console.error('[Kanban Columns POST] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create column', details: error.message },
      { status: 500 }
    );
  }
}
