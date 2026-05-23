import { textResult, errorResult, toolMeta } from '../utils.js';

export { textResult, errorResult, toolMeta };

export function normalizeMemory(memory) {
  return {
    id: memory._id?.toString() || memory.id,
    text: memory.text,
    createdAt: memory.createdAt,
    updatedAt: memory.updatedAt,
  };
}
