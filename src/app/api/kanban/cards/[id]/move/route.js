import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import KanbanCard from '@/models/KanbanCard';
import { requireAdminAuth } from '@/lib/money-auth';

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

    const newColumnId = body.columnId || card.columnId;
    const newPosition = body.position !== undefined ? body.position : card.position;

    const session = await KanbanCard.startSession();
    try {
      session.startTransaction();

      if (newColumnId !== card.columnId.toString()) {
        card.columnId = newColumnId;

        const targetCount = await KanbanCard.countDocuments({
          columnId: newColumnId,
          deletedAt: null,
          _id: { $ne: id },
        });

        card.position = newPosition !== undefined ? newPosition : targetCount;
      } else {
        card.position = newPosition;
      }

      card.syncVersion += 1;
      await card.save({ session });

      const cardsInColumn = await KanbanCard.find({
        columnId: card.columnId,
        deletedAt: null,
        _id: { $ne: id },
      })
        .sort({ position: 1 })
        .session(session);

      let pos = 0;
      for (const c of cardsInColumn) {
        if (pos === card.position) pos++;
        if (c.position !== pos) {
          c.position = pos;
          c.syncVersion += 1;
          await c.save({ session });
        }
        pos++;
      }

      await session.commitTransaction();
    } catch (txnError) {
      await session.abortTransaction();
      throw txnError;
    } finally {
      session.endSession();
    }

    const updatedCard = await KanbanCard.findById(id).lean();
    return NextResponse.json({ card: updatedCard });
  } catch (error) {
    console.error('[Kanban Card MOVE] Error:', error);
    return NextResponse.json(
      { error: 'Failed to move card', details: error.message },
      { status: 500 }
    );
  }
}
