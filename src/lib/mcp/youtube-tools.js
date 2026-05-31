import { z } from 'zod';
import { youtubeSearch } from '@/lib/agents/utils/youtube-tools';
import { MCP_SCOPES } from './server-definitions';

export function createYoutubeSearchMcpTool() {
  return {
    name: 'youtube_search',
    title: 'YouTube Search',
    description:
      'Search for educational YouTube videos on a specific topic. Returns a list of videos with titles, URLs, and descriptions. Use this to find videos or provide visual learning resources.',
    schema: z.object({
      query: z.string().describe('The search query for videos (e.g., "SQL Joins tutorial")'),
      maxResults: z
        .number()
        .optional()
        .default(5)
        .describe('Number of results to return (default 5)'),
    }),
    annotations: {
      title: 'YouTube Search',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
    async invoke({ query, maxResults = 5 }) {
      const result = await youtubeSearch.invoke({ query, maxResults });
      try {
        return JSON.parse(result);
      } catch (e) {
        return result;
      }
    },
  };
}

export function createAllYoutubeMcpTools({ scopes = [] } = {}) {
  const tools = [];
  const scopeSet = new Set(scopes);

  if (scopeSet.has(MCP_SCOPES.YOUTUBE_SEARCH) || scopes.length === 0) {
    tools.push(createYoutubeSearchMcpTool());
  }

  return tools;
}
