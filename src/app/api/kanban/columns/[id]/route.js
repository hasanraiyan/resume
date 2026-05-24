import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import KanbanColumn from '@/models/KanbanColumn';
import KanbanCard from '@/models/KanbanCard';
import { requireAdminAuth } from '@/lib/money-auth';

export async function PUT(req, { params }) {
  const { id } = await params;
  const authResult = await requireAdminAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    await dbConnect();
    const body = await req.json();

    const column = await KanbanColumn.findOne({ _id: id, deletedAt: null });
    if (!column) {
      return NextResponse.json({ error: 'Column not found' }, { status: 404 });
    }

    if (body.title !== undefined) column.title = body.title.trim();
    if (body.color !== undefined) column.color = body.color;
    if (body.position !== undefined) column.position = body.position;
    if (body.wipLimit !== undefined) column.wipLimit = body.wipLimit;
    column.syncVersion += 1;
    await column.save();

    return NextResponse.json({ column });
  } catch (error) {
    console.error('[Kanban Column PUT] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update column', details: error.message },
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

    const column = await KanbanColumn.findOne({ _id: id, deletedAt: null });
    if (!column) {
      return NextResponse.json({ error: 'Column not found' }, { status: 404 });
    }

    column.deletedAt = new Date();
    column.syncVersion += 1;
    await column.save();

    await KanbanCard.updateMany(
      { columnId: id, deletedAt: null },
      { deletedAt: new Date(), $inc: { syncVersion: 1 } }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Kanban Column DELETE] Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete column', details: error.message },
      { status: 500 }
    );
  }
}
