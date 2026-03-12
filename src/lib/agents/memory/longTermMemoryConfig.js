const DEFAULT_LONG_TERM_MEMORY = Object.freeze({
  enabled: false,
  retrievalLimit: 6,
  maxEntriesPerUser: 60,
  minSalienceToStore: 0.65,
});

function toPlainObject(value) {
  if (!value) return {};
  if (value instanceof Map) {
    return Object.fromEntries(value.entries());
  }
  if (typeof value === 'object') {
    return value;
  }
  return {};
}

function clampNumber(value, fallback, min, max) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return fallback;
  }
  return Math.min(Math.max(numericValue, min), max);
}

export function normalizeLongTermMemoryConfig(config = {}) {
  const source = toPlainObject(config);
  return {
    enabled: Boolean(source.enabled),
    retrievalLimit: Math.round(
      clampNumber(source.retrievalLimit, DEFAULT_LONG_TERM_MEMORY.retrievalLimit, 1, 20)
    ),
    maxEntriesPerUser: Math.round(
      clampNumber(source.maxEntriesPerUser, DEFAULT_LONG_TERM_MEMORY.maxEntriesPerUser, 5, 500)
    ),
    minSalienceToStore: Number(
      clampNumber(
        source.minSalienceToStore,
        DEFAULT_LONG_TERM_MEMORY.minSalienceToStore,
        0,
        1
      ).toFixed(2)
    ),
  };
}

export function getLongTermMemoryConfig(metadata = {}) {
  const plainMetadata = toPlainObject(metadata);
  return normalizeLongTermMemoryConfig(plainMetadata.longTermMemory);
}

export function mergeLongTermMemoryMetadata(metadata = {}, updates = {}) {
  const plainMetadata = toPlainObject(metadata);
  return {
    ...plainMetadata,
    longTermMemory: normalizeLongTermMemoryConfig({
      ...toPlainObject(plainMetadata.longTermMemory),
      ...toPlainObject(updates),
    }),
  };
}

export function normalizeMemoryContext(memoryContext = {}) {
  return {
    platform: memoryContext.platform ? String(memoryContext.platform) : '',
    integrationId: memoryContext.integrationId ? String(memoryContext.integrationId) : '',
    chatId: memoryContext.chatId !== undefined ? String(memoryContext.chatId) : '',
    chatType: memoryContext.chatType ? String(memoryContext.chatType) : '',
    userId:
      memoryContext.userId !== undefined && memoryContext.userId !== null
        ? String(memoryContext.userId)
        : '',
    username: memoryContext.username ? String(memoryContext.username) : '',
  };
}

export function isPrivateTelegramMemoryContext(memoryContext = {}) {
  const normalized = normalizeMemoryContext(memoryContext);
  return (
    normalized.platform === 'telegram' &&
    normalized.chatType === 'private' &&
    Boolean(normalized.integrationId) &&
    Boolean(normalized.userId || normalized.chatId)
  );
}

export function buildTelegramMemoryNamespaceKey(memoryContext = {}) {
  const normalized = normalizeMemoryContext(memoryContext);
  if (!isPrivateTelegramMemoryContext(normalized)) {
    return '';
  }

  const scopedUserId = normalized.userId || normalized.chatId;
  return `telegram:${normalized.integrationId}:${scopedUserId}`;
}

export { DEFAULT_LONG_TERM_MEMORY };
