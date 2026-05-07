import { z } from 'zod';
import {
  searchEntries,
  getEntries,
  getJournalStats,
  getAllTags,
} from '@/lib/apps/journaly/service/service';

export function registerJournalyTools(server) {
  server.tool(
    'search_entries',
    'Semantic search over all journal entries via Qdrant',
    {
      query: z.string().describe('The search query or question'),
      limit: z.number().optional().default(10).describe('Max results to return'),
    },
    async ({ query, limit }) => {
      const results = await searchEntries(query, limit);
      return {
        content: [{ type: 'text', text: JSON.stringify(results, null, 2) }],
      };
    }
  );

  server.tool(
    'get_recent_entries',
    'Return the N most recent entries with full body',
    {
      limit: z.number().optional().default(10).describe('Number of entries'),
    },
    async ({ limit }) => {
      const entries = await getEntries({ limit });
      return {
        content: [{ type: 'text', text: JSON.stringify(entries, null, 2) }],
      };
    }
  );

  server.tool(
    'get_entries_by_date_range',
    'Return entries between two ISO dates',
    {
      startDate: z.string().describe('ISO date string (start)'),
      endDate: z.string().describe('ISO date string (end)'),
    },
    async ({ startDate, endDate }) => {
      const entries = await getEntries({ startDate, endDate });
      return {
        content: [{ type: 'text', text: JSON.stringify(entries, null, 2) }],
      };
    }
  );

  server.tool(
    'get_mood_summary',
    'Return mood averages and distribution across writing history',
    {},
    async () => {
      const stats = await getJournalStats();
      return {
        content: [{ type: 'text', text: JSON.stringify(stats, null, 2) }],
      };
    }
  );

  server.tool(
    'get_tags',
    'List all tags with usage counts',
    {},
    async () => {
      const stats = await getJournalStats();
      return {
        content: [{ type: 'text', text: JSON.stringify(stats.topTags, null, 2) }],
      };
    }
  );
}
