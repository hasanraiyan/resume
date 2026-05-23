import { z } from 'zod';
import { youtubeSearch } from '@/lib/agents/utils/youtube-tools';
import { READ_ONLY_ANNOTATIONS } from '../utils.js';
import { textResult, errorResult, toolMeta } from '../utils.js';

function parseYoutubeResult(result) {
  try {
    const parsed = JSON.parse(result);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function registerYoutubeTools(server) {
  server.registerTool(
    'youtube_search',
    {
      title: 'YouTube Search',
      description:
        'Search YouTube for educational videos and tutorials. Returns titles, URLs, descriptions, thumbnails, video IDs, and channel names.',
      annotations: READ_ONLY_ANNOTATIONS,
      inputSchema: {
        query: z.string().describe('The search query for videos, such as "SQL joins tutorial".'),
        maxResults: z
          .number()
          .int()
          .min(1)
          .max(10)
          .optional()
          .describe('Number of results to return, from 1 to 10. Defaults to 5.'),
      },
      _meta: toolMeta('Searching YouTube...', 'YouTube search complete.'),
    },
    async ({ query, maxResults = 5 }) => {
      try {
        const result = await youtubeSearch.invoke({
          query,
          maxResults,
        });

        const videos = parseYoutubeResult(result);
        if (!videos) {
          return textResult(result);
        }

        return textResult(`Found ${videos.length} YouTube videos.`, {
          kind: 'youtube_videos',
          query,
          videos,
        });
      } catch (err) {
        return errorResult(`YouTube search failed: ${err.message}`);
      }
    }
  );
}
