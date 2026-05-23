import { z } from 'zod';
import dbConnect from '@/lib/dbConnect';
import RecallMemory from '@/models/RecallMemory';
import {
  createRecallMemory,
  searchRecallMemories,
  updateRecallMemory,
  deleteRecallMemory,
} from '@/lib/recall/memory-service';
import {
  READ_ONLY_ANNOTATIONS,
  MUTATION_ANNOTATIONS,
  DESTRUCTIVE_ANNOTATIONS,
} from './constants.js';
import { textResult, errorResult, toolMeta, normalizeMemory } from './utils.js';

export function registerRecallTools(server) {
  server.registerTool(
    'list_memories',
    {
      title: 'List Memories',
      description: 'Retrieve a list of all saved memories. Returns the most recent memories first.',
      annotations: READ_ONLY_ANNOTATIONS,
      inputSchema: {
        limit: z.number().optional().describe('Maximum number of memories to return (default: 20)'),
      },
      _meta: toolMeta('Loading memories...', 'Memories loaded.'),
    },
    async (params) => {
      try {
        await dbConnect();
        const limit = params.limit || 20;
        const memories = await RecallMemory.find().sort({ createdAt: -1 }).limit(limit).lean();

        const normalized = memories.map(normalizeMemory);
        return textResult(`Retrieved ${normalized.length} memories.`, {
          kind: 'memories',
          memories: normalized,
        });
      } catch (err) {
        return errorResult(`Error listing memories: ${err.message}`);
      }
    }
  );

  server.registerTool(
    'create_memory',
    {
      title: 'Create Memory',
      description: 'Save a new memory or thought with vector embedding for semantic search later.',
      annotations: MUTATION_ANNOTATIONS,
      inputSchema: {
        text: z.string().describe('The memory content to save'),
      },
      _meta: toolMeta('Saving memory...', 'Memory saved.'),
    },
    async (params) => {
      try {
        const memory = await createRecallMemory(params.text);
        return textResult('Memory saved successfully.', {
          success: true,
          memory: normalizeMemory(memory),
        });
      } catch (err) {
        return errorResult(`Error creating memory: ${err.message}`);
      }
    }
  );

  server.registerTool(
    'search_memories',
    {
      title: 'Search Memories',
      description:
        'Semantic vector search over saved memories (same as the ReCall app search). Returns the closest matches by meaning.',
      annotations: READ_ONLY_ANNOTATIONS,
      inputSchema: {
        query: z.string().describe('Search query to find matching memories'),
        limit: z.number().optional().describe('Maximum number of results to return (default: 10)'),
      },
      _meta: toolMeta('Searching memories...', 'Search complete.'),
    },
    async (params) => {
      try {
        if (!params.query || !params.query.trim()) {
          return errorResult('Search query cannot be empty');
        }

        const limit = params.limit || 10;
        const memories = await searchRecallMemories(params.query, limit);

        const normalized = memories.map((m) => ({
          ...normalizeMemory(m),
          score: m.score,
        }));

        return textResult(`Found ${normalized.length} matching memories.`, {
          kind: 'memories',
          query: params.query.trim(),
          memories: normalized,
        });
      } catch (err) {
        return errorResult(`Error searching memories: ${err.message}`);
      }
    }
  );

  server.registerTool(
    'update_memory',
    {
      title: 'Update Memory',
      description: 'Edit an existing memory by its ID and refresh its search embedding.',
      annotations: MUTATION_ANNOTATIONS,
      inputSchema: {
        id: z.string().describe('The memory ID to update'),
        text: z.string().describe('The updated memory content'),
      },
      _meta: toolMeta('Updating memory...', 'Memory updated.'),
    },
    async (params) => {
      try {
        const memory = await updateRecallMemory(params.id, params.text);

        if (!memory) {
          return errorResult('Memory not found');
        }

        return textResult('Memory updated successfully.', {
          success: true,
          memory: normalizeMemory(memory),
        });
      } catch (err) {
        return errorResult(`Error updating memory: ${err.message}`);
      }
    }
  );

  server.registerTool(
    'delete_memory',
    {
      title: 'Delete Memory',
      description:
        'Permanently delete a memory by its ID from MongoDB and Qdrant. This action cannot be undone.',
      annotations: DESTRUCTIVE_ANNOTATIONS,
      inputSchema: {
        id: z.string().describe('The memory ID to delete'),
      },
      _meta: toolMeta('Deleting memory...', 'Memory deleted.'),
    },
    async (params) => {
      try {
        const memory = await deleteRecallMemory(params.id);

        if (!memory) {
          return errorResult('Memory not found');
        }

        return textResult('Memory deleted successfully.', {
          success: true,
          deletedId: memory._id.toString(),
        });
      } catch (err) {
        return errorResult(`Error deleting memory: ${err.message}`);
      }
    }
  );

  server.registerTool(
    'get_memory_stats',
    {
      title: 'Get Memory Statistics',
      description:
        'Get statistics about your memory bank, including total count and creation dates.',
      annotations: READ_ONLY_ANNOTATIONS,
      inputSchema: {},
      _meta: toolMeta('Loading statistics...', 'Statistics ready.'),
    },
    async () => {
      try {
        await dbConnect();
        const total = await RecallMemory.countDocuments();
        const oldest = await RecallMemory.findOne().sort({ createdAt: 1 }).lean();
        const newest = await RecallMemory.findOne().sort({ createdAt: -1 }).lean();

        return textResult('Memory statistics retrieved.', {
          kind: 'stats',
          stats: {
            totalMemories: total,
            oldestMemory: oldest ? oldest.createdAt : null,
            newestMemory: newest ? newest.createdAt : null,
          },
        });
      } catch (err) {
        return errorResult(`Error getting statistics: ${err.message}`);
      }
    }
  );
}
