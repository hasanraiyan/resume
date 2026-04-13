import { QdrantClient } from '@qdrant/js-client-rest';
import MemoscribeSettings from '@/models/MemoscribeSettings';
import dbConnect from '@/lib/dbConnect';
import { decrypt } from '@/lib/crypto';
import agentRegistry from '@/lib/agents';
import { AGENT_IDS } from '@/lib/constants/agents';

/**
 * Returns a configured Qdrant client for a specific user.
 * It fetches the user's settings, decrypts the API key, and creates a Qdrant client.
 * Returns null if the user hasn't configured Qdrant.
 */
export async function getUserQdrantClient(userId) {
  await dbConnect();
  const settings = await MemoscribeSettings.findOne({ userId });

  if (!settings || !settings.qdrantUrl) {
    return null;
  }

  const apiKey = settings.qdrantApiKey ? decrypt(settings.qdrantApiKey) : '';

  return new QdrantClient({
    url: settings.qdrantUrl,
    apiKey: apiKey,
  });
}

/**
 * Ensure the collection exists for the user. We append the user ID to isolate collections,
 * or use a common collection with payload filtering. For this app, let's use a single
 * collection called `memoscribe_notes` and filter by userId.
 */
export async function ensureUserCollection(client) {
  const collectionName = 'memoscribe_notes';
  const vectorSize = 1536; // OpenAI text-embedding-3-small dimension

  try {
    const collections = await client.getCollections();
    const exists = collections.collections.some((c) => c.name === collectionName);

    if (exists) {
      return collectionName;
    }

    await client.createCollection(collectionName, {
      vectors: {
        size: vectorSize,
        distance: 'Cosine',
      },
    });
    return collectionName;
  } catch (error) {
    console.error('Error ensuring user Qdrant collection:', error);
    throw error;
  }
}

/**
 * Creates an embedding for a given text using the specialized MEMO_EMBEDDER agent.
 */
export async function generateEmbedding(text) {
  const agent = agentRegistry.getAgent(AGENT_IDS.MEMO_EMBEDDER);
  if (!agent) {
    throw new Error('MEMO_EMBEDDER agent not found in registry');
  }

  if (!agent.isInitialized) {
    await agent.initialize();
  }

  return await agent.embedQuery(text);
}
