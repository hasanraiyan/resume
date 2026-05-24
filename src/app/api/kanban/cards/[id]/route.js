import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import KanbanCard from '@/models/KanbanCard';
import { requireAdminAuth } from '@/lib/money-auth';

export async function GET(req, { params }) {
  const { id } = await params;
  const authResult = await requireAdminAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    await dbConnect();

    const card = await KanbanCard.findOne({ _id: id, deletedAt: null }).lean();
    if (!card) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    return NextResponse.json({ card });
  } catch (error) {
    console.error('[Kanban Card GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch card', details: error.message },
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

    const card = await KanbanCard.findOne({ _id: id, deletedAt: null });
    if (!card) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    if (body.title !== undefined) card.title = body.title.trim();
    if (body.description !== undefined) card.description = body.description.trim();
    if (body.priority !== undefined) card.priority = body.priority;
    if (body.dueDate !== undefined) card.dueDate = body.dueDate;
    if (body.labels !== undefined) card.labels = body.labels;
    if (body.checklist !== undefined) card.checklist = body.checklist;
    card.syncVersion += 1;
    await card.save();

    return NextResponse.json({ card });
  } catch (error) {
    console.error('[Kanban Card PUT] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update card', details: error.message },
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

    const card = await KanbanCard.findOne({ _id: id, deletedAt: null });
    if (!card) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    card.deletedAt = new Date();
    card.syncVersion += 1;
    await card.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Kanban Card DELETE] Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete card', details: error.message },
      { status: 500 }
    );
  }
}
