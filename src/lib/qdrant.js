import { QdrantClient } from '@qdrant/js-client-rest';

const QDRANT_URL = process.env.QDRANT_URL || 'http://localhost:6333';
const QDRANT_API_KEY = process.env.QDRANT_API_KEY || '';

export const qdrantClient = new QdrantClient({
  url: QDRANT_URL,
  apiKey: QDRANT_API_KEY,
});

/**
 * Converts a 24-char MongoDB ObjectID to a valid 32-char UUID string for Qdrant.
 * We pad the 24 hex chars with 8 trailing zeros and add standard UUID dashes.
 */
export function mongoIdToUuid(mongoId) {
  const hex = mongoId.toString().padEnd(32, '0');
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join('-');
}

export async function ensureCollection(collectionName, vectorSize) {
  try {
    const collections = await qdrantClient.getCollections();
    const exists = collections.collections.some((c) => c.name === collectionName);

    if (exists) {
      // Check if dimension matches
      const info = await qdrantClient.getCollection(collectionName);
      const currentSize = info.config.params.vectors.size;

      if (currentSize !== vectorSize) {
        console.warn(
          `Qdrant collection dimension mismatch: expected ${vectorSize}, found ${currentSize}. Recreating collection...`
        );
        await qdrantClient.deleteCollection(collectionName);
        // Fall through to creation logic
      } else {
        return true;
      }
    }

    console.log(`Creating Qdrant collection: ${collectionName} (Size: ${vectorSize})`);
    await qdrantClient.createCollection(collectionName, {
      vectors: {
        size: vectorSize,
        distance: 'Cosine',
      },
    });
    return true;
  } catch (error) {
    console.error('Error ensuring Qdrant collection:', error);
    return false;
  }
}
