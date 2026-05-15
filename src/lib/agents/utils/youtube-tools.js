import { tool } from '@langchain/core/tools';
import { z } from 'zod';

/**
 * YouTube Search Tool
 * Uses Google YouTube Data API v3 to find educational videos.
 */

const YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3/search';

export const youtubeSearch = tool(
  async ({ query, maxResults = 5 }) => {
    const apiKey = process.env.GOOGLE_API_KEY || process.env.YOUTUBE_API_KEY;

    if (!apiKey) {
      console.warn('[YouTubeTool] Missing GOOGLE_API_KEY or YOUTUBE_API_KEY in environment.');
      return 'YouTube search is currently unavailable (missing API key).';
    }

    try {
      const url = new URL(YOUTUBE_API_URL);
      url.searchParams.append('part', 'snippet');
      url.searchParams.append('q', `${query} educational`); // Append "educational" to improve relevance
      url.searchParams.append('type', 'video');
      url.searchParams.append('maxResults', maxResults.toString());
      url.searchParams.append('key', apiKey);
      url.searchParams.append('relevanceLanguage', 'en');
      url.searchParams.append('safeSearch', 'moderate');

      const response = await fetch(url.toString());

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || `YouTube API error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.items || data.items.length === 0) {
        return 'No relevant videos found for this topic.';
      }

      const videos = data.items.map((item) => ({
        title: item.snippet.title,
        description: item.snippet.description,
        videoId: item.id.videoId,
        url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
        channelTitle: item.snippet.channelTitle,
      }));

      return JSON.stringify(videos);
    } catch (error) {
      console.error('[YouTubeTool] Search failed:', error);
      return `Failed to search YouTube: ${error.message}`;
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
