import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { BaseAgent } from '../BaseAgent';
import {
  getUserQdrantClient,
  ensureUserCollection,
  generateEmbedding,
} from '@/lib/memoscribe-qdrant';

export class MemoscribeAgent extends BaseAgent {
  constructor() {
    super({
      id: 'memoscribe_agent',
      name: 'Memo Scribe Assistant',
      description:
        'An AI assistant that can search your saved notes using RAG and answer questions.',
      systemPrompt: `You are the Memo Scribe Assistant, an intelligent helper that can search through a user's saved notes (clips/texts).
Use the 'search_memos' tool to find relevant information from the user's notes whenever they ask a question that might require recalling past information.
If you find relevant notes, use them to construct a helpful, accurate, and concise response. If you cannot find relevant information, let the user know.`,
    });
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
