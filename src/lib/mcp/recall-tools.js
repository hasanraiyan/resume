import { z } from 'zod';
import mongoose from 'mongoose';
import dbConnect from '@/lib/dbConnect';
import RecallMemory from '@/models/RecallMemory';
import {
  createRecallMemory,
  deleteRecallMemory,
  searchRecallMemories,
  updateRecallMemory,
} from '@/lib/recall/memory-service';

const RECALL_READ_SCOPE = 'recall:read';
const RECALL_WRITE_SCOPE = 'recall:write';

function hasScope(scopes, scope) {
  return Array.isArray(scopes) && scopes.includes(scope);
}

function isValidObjectId(value) {
  return typeof value === 'string' && mongoose.Types.ObjectId.isValid(value);
}

function serializeMemory(memory) {
  return {
    id: memory._id?.toString?.() || memory.id,
    text: memory.text,
    qdrantId: memory.qdrantId || null,
    score: memory.score,
    createdAt: memory.createdAt?.toISOString?.() || memory.createdAt || null,
    updatedAt: memory.updatedAt?.toISOString?.() || memory.updatedAt || null,
  };
}

function createListRecallMemoriesTool() {
  return {
    name: 'list_memories',
    title: 'List Memories',
    description:
      'List recently captured Recall memories. Use this when the user asks what memories are saved, wants recent notes, or needs a memory ID before updating or deleting.',
    schema: z.object({
      limit: z.number().optional().describe('Maximum memories to return. Default 20, maximum 100.'),
      skip: z.number().optional().describe('Number of memories to skip for pagination. Default 0.'),
    }),
    annotations: {
      title: 'List Memories',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    async invoke({ limit = 20, skip = 0 } = {}) {
      await dbConnect();
      const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
      const safeSkip = Math.max(Number(skip) || 0, 0);
      const memories = await RecallMemory.find({})
        .sort({ createdAt: -1 })
        .skip(safeSkip)
        .limit(safeLimit)
        .lean();

      return memories.map(serializeMemory);
    },
  };
}

function createSearchRecallMemoriesTool() {
  return {
    name: 'search_memories',
    title: 'Search Memories',
    description:
      'Search Recall memories semantically using Qdrant embeddings. Use this for questions about saved thoughts, ideas, links, notes, or anything the user may have captured earlier.',
    schema: z.object({
      query: z.string().describe('Search query to match against saved memories.'),
      limit: z.number().optional().describe('Maximum memories to return. Default 10, maximum 50.'),
    }),
    annotations: {
      title: 'Search Memories',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    async invoke({ query, limit = 10 }) {
      const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 50);
      const memories = await searchRecallMemories(query, safeLimit);
      return memories.map(serializeMemory);
    },
  };
}

function createCaptureRecallMemoryTool() {
  return {
    name: 'capture_memory',
    title: 'Capture Memory',
    description:
      'Capture a new Recall memory. Use this when the user asks to save, remember, capture, or store a thought, idea, note, or link.',
    schema: z.object({
      text: z.string().describe('Memory text to save.'),
    }),
    annotations: {
      title: 'Capture Memory',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    },
    async invoke({ text }) {
      const memory = await createRecallMemory(text);
      return serializeMemory(memory);
    },
  };
}

function createUpdateRecallMemoryTool() {
  return {
    name: 'update_memory',
    title: 'Update Memory',
    description:
      'Update the text of an existing Recall memory. Always resolve the memory ID with list_memories or search_memories before calling this tool.',
    schema: z.object({
      id: z.string().describe('Recall memory ID resolved from list_memories or search_memories.'),
      text: z.string().describe('Replacement memory text.'),
    }),
    annotations: {
      title: 'Update Memory',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    async invoke({ id, text }) {
      if (!isValidObjectId(id)) {
        throw new Error('A valid Recall memory ID is required.');
      }

      const memory = await updateRecallMemory(id, text);
      if (!memory) {
        throw new Error('Recall memory not found.');
      }

      return serializeMemory(memory);
    },
  };
}

function createDeleteRecallMemoryTool() {
  return {
    name: 'delete_memory',
    title: 'Delete Memory',
    description:
      'Delete an existing Recall memory. Always resolve the memory ID with list_memories or search_memories before calling this tool.',
    schema: z.object({
      id: z.string().describe('Recall memory ID resolved from list_memories or search_memories.'),
    }),
    annotations: {
      title: 'Delete Memory',
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
      openWorldHint: false,
    },
    async invoke({ id }) {
      if (!isValidObjectId(id)) {
        throw new Error('A valid Recall memory ID is required.');
      }

      const memory = await deleteRecallMemory(id);
      if (!memory) {
        throw new Error('Recall memory not found.');
      }

      return {
        success: true,
        deletedMemory: serializeMemory(memory),
      };
    },
  };
}

export function createAllRecallMcpTools({ scopes = [] } = {}) {
  const tools = [];

  if (hasScope(scopes, RECALL_READ_SCOPE)) {
    tools.push(createListRecallMemoriesTool(), createSearchRecallMemoriesTool());
  }

  if (hasScope(scopes, RECALL_WRITE_SCOPE)) {
    tools.push(
      createCaptureRecallMemoryTool(),
      createUpdateRecallMemoryTool(),
      createDeleteRecallMemoryTool()
    );
  }

  return tools;
}
