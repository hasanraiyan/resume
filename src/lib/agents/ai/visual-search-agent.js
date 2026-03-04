/**
 * Visual Search Agent
 *
 * Orchestrates semantic search for media assets using a LangGraph StateGraph.
 * Pipeline: embed query → search Qdrant → enrich with MongoDB data
 */

import { AGENT_IDS } from '@/lib/constants/agents';
import BaseAgent from '../BaseAgent';
import { StateGraph, END, START } from '@langchain/langgraph';
import { Annotation } from '@langchain/langgraph';
import { qdrantClient } from '@/lib/qdrant';
import MediaAsset from '@/models/MediaAsset';
import MediaAgentSettings from '@/models/MediaAgentSettings';
import agentRegistry from '../AgentRegistry';

// Define the state schema for the visual search workflow
const SearchState = Annotation.Root({
  query: Annotation({ reducer: (_, b) => b, default: () => '' }),
  limit: Annotation({ reducer: (_, b) => b, default: () => 20 }),
  queryVector: Annotation({ reducer: (_, b) => b, default: () => null }),
  searchHits: Annotation({ reducer: (_, b) => b, default: () => [] }),
  results: Annotation({ reducer: (_, b) => b, default: () => [] }),
  count: Annotation({ reducer: (_, b) => b, default: () => 0 }),
  isSemantic: Annotation({ reducer: (_, b) => b, default: () => true }),
  error: Annotation({ reducer: (_, b) => b, default: () => null }),
});

class VisualSearchAgent extends BaseAgent {
  constructor(agentId = AGENT_IDS.VISUAL_SEARCH, config = {}) {
    super(agentId, config);
    this._graph = null;
  }

  async _onInitialize() {
    this.logger.info('Visual Search Agent initialized (LangGraph)');
  }

  _buildGraph() {
    const self = this;

    // Node 1: Generate embedding for the search query
    const embedNode = async (state) => {
      self.logger.info(`Embedding query: "${state.query}"`);

      const embeddingResult = await agentRegistry.execute(AGENT_IDS.IMAGE_EMBEDDER, {
        text: state.query,
        action: 'embed',
      });

      if (!embeddingResult || !embeddingResult.embedding) {
        return { error: 'Failed to generate embedding for search query' };
      }

      return { queryVector: embeddingResult.embedding };
    };

    // Node 2: Search Qdrant vector database
    const searchNode = async (state) => {
      if (state.error) return state;

      const settings = await MediaAgentSettings.findOne({});
      const collectionName = settings?.qdrantCollection || 'media_assets';

      self.logger.info(`Searching Qdrant collection: ${collectionName} (limit: ${state.limit})`);

      const searchResults = await qdrantClient.search(collectionName, {
        vector: state.queryVector,
        limit: state.limit,
        with_payload: true,
        score_threshold: 0.45,
      });

      if (!searchResults || searchResults.length === 0) {
        return { searchHits: [], results: [], count: 0 };
      }

      return { searchHits: searchResults };
    };

    // Node 3: Enrich results with MongoDB asset data
    const enrichNode = async (state) => {
      if (state.error || state.searchHits.length === 0) return state;

      const assetIds = state.searchHits.map((hit) => hit.payload.id);
      const scores = {};
      state.searchHits.forEach((hit) => {
        scores[hit.payload.id] = hit.score;
      });

      self.logger.info(`Enriching ${assetIds.length} results from MongoDB`);

      const assets = await MediaAsset.find({ _id: { $in: assetIds } }).lean();

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
      };
    };

    const graph = new StateGraph(SearchState)
      .addNode('embed', embedNode)
      .addNode('search', searchNode)
      .addNode('enrich', enrichNode)
      .addEdge(START, 'embed')
      .addEdge('embed', 'search')
      .addEdge('search', 'enrich')
      .addEdge('enrich', END);

    return graph.compile();
  }

  async _onExecute(input) {
    const { query, limit = 20 } = input;

    if (!query) {
      return { results: [], count: 0 };
    }

    this.logger.info(`Performing semantic search for: "${query}" (limit: ${limit})`);

    if (!this._graph) {
      this._graph = this._buildGraph();
    }

    const result = await this._graph.invoke({ query, limit });

    if (result.error) {
      throw new Error(result.error);
    }

    return {
      results: result.results,
      count: result.count,
      isSemantic: result.isSemantic,
    };
  }
}

export default VisualSearchAgent;
