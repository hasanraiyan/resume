import { NextResponse } from 'next/server';
import { updateRecallMemory, deleteRecallMemory } from '@/lib/recall/memory-service';

export async function DELETE(req, { params }) {
  try {
    const { id } = params;
    const memory = await deleteRecallMemory(id);

    if (!memory) {
      return NextResponse.json({ error: 'Memory not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[ReCall DELETE] Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete memory', details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(req, { params }) {
  try {
    const { id } = params;
    const body = await req.json();
    const memory = await updateRecallMemory(id, body.text);

    if (!memory) {
      return NextResponse.json({ error: 'Memory not found' }, { status: 404 });
    }

    return NextResponse.json({ memory });
  } catch (error) {
    console.error('[ReCall PUT] Error:', error);
    const status = error.message === 'Text is required' ? 400 : 500;
    return NextResponse.json(
      { error: 'Failed to update memory', details: error.message },
      { status }
    );
  }
}
