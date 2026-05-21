import { NextResponse } from 'next/server';
import crypto from 'crypto';
import dbConnect from '@/lib/dbConnect';
import RecallMemory from '@/models/RecallMemory';
import { generateEmbedding } from '@/lib/coursify/embeddings';
import { qdrantClient, ensureCollection } from '@/lib/qdrant';

const QDRANT_COLLECTION = 'recall_memories';
const VECTOR_DIMENSIONS = 1536;

export async function GET(req) {
  try {
    await dbConnect();
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);
    const skip = parseInt(url.searchParams.get('skip') || '0', 10);

    const memories = await RecallMemory.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return NextResponse.json({ memories });
  } catch (error) {
    console.error('[ReCall GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch memories', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();
    const { text } = body;

    if (!text || text.trim() === '') {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // Generate embedding
    const embedding = await generateEmbedding(text);

    // Prepare Qdrant point
    const qdrantId = crypto.randomUUID();
    const isReady = await ensureCollection(QDRANT_COLLECTION, VECTOR_DIMENSIONS);

    if (!isReady) {
      throw new Error('Failed to ensure Qdrant collection is ready');
    }

    await qdrantClient.upsert(QDRANT_COLLECTION, {
      wait: true,
      points: [
        {
          id: qdrantId,
          vector: embedding,
          payload: { text },
        },
      ],
    });

    // Save to MongoDB
    const memory = await RecallMemory.create({
      text,
      qdrantId,
    });

    return NextResponse.json({ memory }, { status: 201 });
  } catch (error) {
    console.error('[ReCall POST] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create memory', details: error.message },
      { status: 500 }
    );
  }
}
