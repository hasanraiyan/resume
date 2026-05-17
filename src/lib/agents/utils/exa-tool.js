import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { ExaSearchResults } from '@langchain/exa';
import Exa from 'exa-js';

/**
 * Exa Search Results Tool
 * Neural search engine designed for AI agents.
 */
export const exaSearch = tool(
  async ({ query, numResults = 5 }, { configurable } = {}) => {
    const apiKey = configurable?.apiKey;

    if (!apiKey) {
      return 'Exa API key is missing. Neural search unavailable.';
    }

    try {
      const client = new Exa(apiKey);
      const exaTool = new ExaSearchResults({
        client,
        searchArgs: {
          numResults,
          textContentsOptions: {
            maxCharacters: 2000,
          },
        },
      });

      const results = await exaTool.invoke(query);
      return typeof results === 'string' ? results : JSON.stringify(results);
    } catch (error) {
      console.error('[ExaTool] Search failed:', error.message);
      return `Exa error: ${error.message}`;
    }
  },
  {
    name: 'exa_search',
    description:
      'A neural search engine that finds high-quality, relevant results by semantically understanding natural language queries. Use this for high-signal discovery, academic references, or finding the "best" resources on a topic.',
    schema: z.object({
      query: z.string().describe('The natural language search query.'),
      numResults: z.number().optional().default(5).describe('Number of results to return.'),
    }),
  }
);
