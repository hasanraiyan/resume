import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { AGENT_IDS } from '@/lib/constants/agents';
import BaseAgent from '../BaseAgent';
import {
  getUserQdrantClient,
  ensureUserCollection,
  generateEmbedding,
} from '@/lib/memoscribe-qdrant';

export class MemoscribeAgent extends BaseAgent {
  constructor(agentId = AGENT_IDS.MEMOSCRIBE_AGENT, config = {}) {
    super(agentId, config);
  }

  getTools(params = {}) {
    return [
      tool(
        async ({ query }) => {
          try {
            if (!params.userId) {
              return JSON.stringify({ error: 'User ID is required to search memos.' });
            }

            const qdrantClient = await getUserQdrantClient(params.userId);
            if (!qdrantClient) {
              return JSON.stringify({
                error: 'Qdrant is not configured. Please configure it in the Settings tab.',
              });
            }

            const collectionName = await ensureUserCollection(qdrantClient);
            const vector = await generateEmbedding(query);

            const searchResults = await qdrantClient.search(collectionName, {
              vector: vector,
              limit: 5,
              filter: {
                must: [
                  {
                    key: 'userId',
                    match: {
                      value: params.userId,
                    },
                  },
                ],
              },
            });

            const formattedResults = searchResults.map((res) => ({
              score: res.score,
              title: res.payload.title,
              description: res.payload.description,
              text: res.payload.text,
            }));

            return JSON.stringify({ results: formattedResults });
          } catch (error) {
            this.logger.error('Error in search_memos tool:', error);
            return JSON.stringify({ error: 'Failed to search memos: ' + error.message });
          }
        },
        {
          name: 'search_memos',
          description:
            "Search the user's saved notes/memos for relevant information based on a semantic query.",
          schema: z.object({
            query: z.string().describe('The search query or question to find relevant notes for.'),
          }),
        }
      ),
    ];
  }
}

export const memoscribeAgent = new MemoscribeAgent();
