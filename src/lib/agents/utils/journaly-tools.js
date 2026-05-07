import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import {
  getEntries,
  getEntryById,
  searchEntries,
  getJournalStats,
} from '@/lib/apps/journaly/service/service';

function createPresentationSchema(description) {
  return z.enum(['text', 'card']).optional().describe(description);
}

export function createSearchEntriesTool() {
  return tool(
    async ({ query, limit }) => {
      const results = await searchEntries(query, limit || 10);
      return JSON.stringify(
        results.map((r) => ({
          id: r._id,
          title: r.title,
          bodyExcerpt: r.body.substring(0, 300),
          mood: r.mood,
          tags: r.tags,
          createdAt: r.createdAt,
          score: r.score,
        }))
      );
    },
    {
      name: 'search_entries',
      description:
        'Perform a semantic search over journal entries using vector similarity. Use this when the user asks questions about past thoughts, reflections, or "when did I write about X?". Returns the most relevant entries even if keywords don\'t match exactly.',
      schema: z.object({
        query: z.string().describe('The search query or question to find relevant entries for.'),
        limit: z.number().optional().describe('Number of results to return (default 10).'),
        presentation: createPresentationSchema(
          'Choose "card" to show a visual list of search results, or "text" for a text summary.'
        ),
      }),
    }
  );
}

export function createGetEntriesByDateRangeTool() {
  return tool(
    async ({ startDate, endDate, limit }) => {
      const entries = await getEntries({ startDate, endDate, limit: limit || 50 });
      return JSON.stringify(
        entries.map((e) => ({
          id: e._id,
          title: e.title,
          bodyExcerpt: e.body.substring(0, 300),
          mood: e.mood,
          tags: e.tags,
          createdAt: e.createdAt,
        }))
      );
    },
    {
      name: 'get_entries_by_date_range',
      description:
        'Fetch journal entries written within a specific date range. Use this when the user asks for entries from "last week", "March 2024", or between two specific dates.',
      schema: z.object({
        startDate: z.string().describe('ISO date string for the start of the range.'),
        endDate: z.string().describe('ISO date string for the end of the range.'),
        limit: z.number().optional().describe('Maximum entries to return (default 50).'),
        presentation: createPresentationSchema(
          'Choose "card" for a visual timeline view, or "text" for a summary.'
        ),
      }),
    }
  );
}

export function createGetEntryByIdTool() {
  return tool(
    async ({ id }) => {
      const entry = await getEntryById(id);
      return JSON.stringify(entry);
    },
    {
      name: 'get_entry_by_id',
      description:
        'Retrieve the full content of a specific journal entry by its ID. Use this when you have an ID from a search result and need to read the entire entry to answer a detailed question.',
      schema: z.object({
        id: z.string().describe('The MongoDB ID of the entry to fetch.'),
      }),
    }
  );
}

export function createGetMoodSummaryTool() {
  return tool(
    async () => {
      const stats = await getJournalStats();
      return JSON.stringify({
        totalEntries: stats.totalEntries,
        moodDistribution: stats.moodDistribution,
        currentStreak: stats.currentStreak,
        longestStreak: stats.longestStreak,
        avgLength: stats.avgLength,
        topTags: stats.topTags,
      });
    },
    {
      name: 'get_mood_summary',
      description:
        'Get a summary of moods and writing statistics. Use this when the user asks "how have I been feeling lately?" or "what are my journal stats?".',
      schema: z.object({
        presentation: createPresentationSchema(
          'Choose "card" for a visual insights dashboard, or "text" for a text summary.'
        ),
      }),
    }
  );
}

export function createJournalyTools() {
  return [
    createSearchEntriesTool(),
    createGetEntriesByDateRangeTool(),
    createGetEntryByIdTool(),
    createGetMoodSummaryTool(),
  ];
}
