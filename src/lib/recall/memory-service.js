import crypto from 'crypto';
import dbConnect from '@/lib/dbConnect';
import RecallMemory from '@/models/RecallMemory';
import { generateEmbedding } from '@/lib/coursify/embeddings';
import { qdrantClient, ensureCollection } from '@/lib/qdrant';

export const QDRANT_COLLECTION = 'recall_memories';
export const VECTOR_DIMENSIONS = 1536;

export async function createRecallMemory(text) {
  const trimmed = text?.trim();
  if (!trimmed) {
    throw new Error('Text is required');
  }

  await dbConnect();

  const embedding = await generateEmbedding(trimmed);
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
        payload: { text: trimmed },
      },
    ],
  });

  return RecallMemory.create({
    text: trimmed,
    qdrantId,
  });
}

export async function searchRecallMemories(query, limit = 10) {
  const trimmed = query?.trim();
  if (!trimmed) {
    throw new Error('Search query is required');
  }

  await dbConnect();

  const queryEmbedding = await generateEmbedding(trimmed);
  const searchResults = await qdrantClient.search(QDRANT_COLLECTION, {
    vector: queryEmbedding,
    limit,
    with_payload: true,
    with_vector: false,
  });

  const qdrantIds = searchResults.map((result) => result.id);
  const scoreMap = searchResults.reduce((acc, result) => {
    acc[result.id] = result.score;
    return acc;
  }, {});

  if (qdrantIds.length === 0) {
    return [];
  }

  const memories = await RecallMemory.find({
    qdrantId: { $in: qdrantIds },
  }).lean();

  return memories
    .sort((a, b) => (scoreMap[b.qdrantId] || 0) - (scoreMap[a.qdrantId] || 0))
    .map((memory) => ({
      ...memory,
      score: scoreMap[memory.qdrantId],
    }));
}

export async function updateRecallMemory(id, text) {
  const trimmed = text?.trim();
  if (!trimmed) {
    throw new Error('Text is required');
  }

  await dbConnect();

  const memory = await RecallMemory.findById(id);
  if (!memory) {
    return null;
  }

  const embedding = await generateEmbedding(trimmed);

  if (memory.qdrantId) {
    await qdrantClient.upsert(QDRANT_COLLECTION, {
      wait: true,
      points: [
        {
          id: memory.qdrantId,
          vector: embedding,
          payload: { text: trimmed },
        },
      ],
    });
  }

  memory.text = trimmed;
  await memory.save();

  return memory;
}

export async function deleteRecallMemory(id) {
  await dbConnect();

  const memory = await RecallMemory.findById(id);
  if (!memory) {
    return null;
  }

  if (memory.qdrantId) {
    try {
      await qdrantClient.delete(QDRANT_COLLECTION, {
        points: [memory.qdrantId],
      });
    } catch (qdrantError) {
      console.error('[ReCall] Failed to delete from Qdrant:', qdrantError);
    }
  }

  await RecallMemory.findByIdAndDelete(id);
  return memory;
}
