/**
 * Visual Search Agent
 *
 * Orchestrates semantic search for media assets.
 * 1. Generates query embedding via ImageEmbedderAgent
 * 2. Searches Qdrant vector database
 * 3. Enrichies results with MongoDB asset data
 */

import { AGENT_IDS } from '@/lib/constants/agents';
import BaseAgent from '../BaseAgent';
import { qdrantClient } from '@/lib/qdrant';
import MediaAsset from '@/models/MediaAsset';
import MediaAgentSettings from '@/models/MediaAgentSettings';
import agentRegistry from '../AgentRegistry';

class VisualSearchAgent extends BaseAgent {
  constructor(agentId = AGENT_IDS.VISUAL_SEARCH, config = {}) {
    super(agentId, config);
  }

  async _onInitialize() {
    this.logger.info('Visual Search Agent initialized');
  }

  async _onExecute(input) {
    const { query, limit = 20 } = input;

    if (!query) {
      return { results: [], count: 0 };
    }

    this.logger.info(`Performing semantic search for: "${query}" (limit: ${limit})`);

    // 1. Generate embedding for the search query
    // We delegate this to the specialized ImageEmbedderAgent
    const embeddingResult = await agentRegistry.execute(AGENT_IDS.IMAGE_EMBEDDER, {
      text: query,
      action: 'embed',
    });

    if (!embeddingResult || !embeddingResult.embedding) {
      throw new Error('Failed to generate embedding for search query');
    }

    const queryVector = embeddingResult.embedding;

    // 2. Resolve Qdrant collection
    const settings = await MediaAgentSettings.findOne({});
    const collectionName = settings?.qdrantCollection || 'media_assets';

    // 3. Search Qdrant for similar vectors
    const searchResults = await qdrantClient.search(collectionName, {
      vector: queryVector,
      limit: limit,
      with_payload: true,
      score_threshold: 0.45, // Slightly lower threshold for broader search
    });

    if (!searchResults || searchResults.length === 0) {
      return { results: [], count: 0, isSemantic: true };
    }

    // 4. Extract asset IDs from payload
    const assetIds = searchResults.map((hit) => hit.payload.id);
    const scores = {};
    searchResults.forEach((hit) => {
      scores[hit.payload.id] = hit.score;
    });

    // 5. Fetch asset details from MongoDB
    const assets = await MediaAsset.find({ _id: { $in: assetIds } }).lean();

    // 6. Sort MongoDB results by the order of assetIds from Qdrant and attach score
    const orderedResults = assetIds
      .map((id) => {
        const asset = assets.find((a) => a._id.toString() === id.toString());
        if (asset) {
          return { ...asset, score: scores[id] };
        }
        return null;
      })
      .filter(Boolean);

    return {
      results: orderedResults,
      count: orderedResults.length,
      isSemantic: true,
    };
  }
}

export default VisualSearchAgent;
