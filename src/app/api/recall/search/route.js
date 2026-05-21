import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import RecallMemory from '@/models/RecallMemory';
import { generateEmbedding } from '@/lib/coursify/embeddings';
import { qdrantClient } from '@/lib/qdrant';

const QDRANT_COLLECTION = 'recall_memories';

export async function GET(req) {
  try {
    await dbConnect();
    const url = new URL(req.url);
    const query = url.searchParams.get('q');
    const limit = parseInt(url.searchParams.get('limit') || '10', 10);

    if (!query || query.trim() === '') {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
    }

    // 1. Generate embedding for the search query
    const queryEmbedding = await generateEmbedding(query);

    // 2. Search Qdrant for nearest neighbors
    const searchResults = await qdrantClient.search(QDRANT_COLLECTION, {
      vector: queryEmbedding,
      limit,
      with_payload: true,
      with_vector: false,
    });

    // 3. Extract Qdrant IDs and sort order
    const qdrantIds = searchResults.map((result) => result.id);
    const scoreMap = searchResults.reduce((acc, result) => {
      acc[result.id] = result.score;
      return acc;
    }, {});

    if (qdrantIds.length === 0) {
      return NextResponse.json({ memories: [] });
    }

    // 4. Fetch the full documents from MongoDB
    const memories = await RecallMemory.find({
      qdrantId: { $in: qdrantIds },
    }).lean();

    // 5. Sort memories by their Qdrant similarity score
    const sortedMemories = memories.sort((a, b) => {
      const scoreA = scoreMap[a.qdrantId] || 0;
      const scoreB = scoreMap[b.qdrantId] || 0;
      return scoreB - scoreA;
    });

    return NextResponse.json({
      memories: sortedMemories.map((memory) => ({
        ...memory,
        score: scoreMap[memory.qdrantId],
      })),
    });
  } catch (error) {
    console.error('[ReCall Search] Error:', error);
    return NextResponse.json({ error: 'Search failed', details: error.message }, { status: 500 });
  }
}
