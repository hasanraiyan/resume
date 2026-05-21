import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import RecallMemory from '@/models/RecallMemory';
import { generateEmbedding } from '@/lib/coursify/embeddings';
import { qdrantClient } from '@/lib/qdrant';

const QDRANT_COLLECTION = 'recall_memories';

export async function DELETE(req, { params }) {
  try {
    await dbConnect();
    const { id } = params;

    const memory = await RecallMemory.findById(id);
    if (!memory) {
      return NextResponse.json({ error: 'Memory not found' }, { status: 404 });
    }

    // Delete from Qdrant
    if (memory.qdrantId) {
      try {
        await qdrantClient.delete(QDRANT_COLLECTION, {
          points: [memory.qdrantId],
        });
      } catch (qdrantError) {
        console.error('[ReCall DELETE] Failed to delete from Qdrant:', qdrantError);
        // Continue with Mongo deletion even if Qdrant fails
      }
    }

    // Delete from MongoDB
    await RecallMemory.findByIdAndDelete(id);

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
    await dbConnect();
    const { id } = params;
    const body = await req.json();
    const { text } = body;

    if (!text || text.trim() === '') {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const memory = await RecallMemory.findById(id);
    if (!memory) {
      return NextResponse.json({ error: 'Memory not found' }, { status: 404 });
    }

    // Generate new embedding
    const embedding = await generateEmbedding(text);

    // Update Qdrant point
    if (memory.qdrantId) {
      await qdrantClient.upsert(QDRANT_COLLECTION, {
        wait: true,
        points: [
          {
            id: memory.qdrantId,
            vector: embedding,
            payload: { text },
          },
        ],
      });
    }

    // Update MongoDB
    memory.text = text;
    await memory.save();

    return NextResponse.json({ memory });
  } catch (error) {
    console.error('[ReCall PUT] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update memory', details: error.message },
      { status: 500 }
    );
  }
}
