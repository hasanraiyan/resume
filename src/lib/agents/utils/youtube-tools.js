import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { youtube } from '@googleapis/youtube';
import dynamicSettingsManager from '@/lib/DynamicSettingsManager';

/**
 * YouTube Search Tool
 * Uses official Google YouTube Data API v3 client to find educational videos.
 */
export const youtubeSearch = tool(
  async ({ query, maxResults = 5 }) => {
    // Try to get from DynamicSettings first, fallback to process.env
    let apiKey = await dynamicSettingsManager.get('GOOGLE_API_KEY');

    if (!apiKey) {
      console.warn('[YouTubeTool] Missing GOOGLE_API_KEY in environment or database.');
      return 'YouTube search is currently unavailable (missing API key).';
    }

    // Initialize official client
    const yt = youtube({ version: 'v3', auth: apiKey });

    try {
      const res = await yt.search.list({
        part: ['snippet'],
        q: `${query} educational`,
        type: ['video'],
        maxResults,
        safeSearch: 'moderate',
        relevanceLanguage: 'en',
      });

      if (!res.data.items || res.data.items.length === 0) {
        return 'No relevant videos found for this topic.';
      }

      const videos = res.data.items.map((item) => ({
        title: item.snippet?.title,
        description: item.snippet?.description,
        videoId: item.id?.videoId,
        url: `https://www.youtube.com/watch?v=${item.id?.videoId}`,
        thumbnail: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url,
        channelTitle: item.snippet?.channelTitle,
      }));

      return JSON.stringify(videos);
    } catch (error) {
      console.error('[YouTubeTool] Search failed:', error);
      return `YouTube API error: ${error.message}`;
    }
  },
  {
    name: 'youtube_search',
    description:
      'Search for educational YouTube videos on a specific topic. Returns a list of videos with titles, URLs, and descriptions. Use this to find videos for [VideoBlock] or to provide visual learning resources.',
    schema: z.object({
      query: z.string().describe('The search query for videos (e.g., "SQL Joins tutorial")'),
      maxResults: z
        .number()
        .optional()
        .default(5)
        .describe('Number of results to return (default 5)'),
    }),
  }
);
