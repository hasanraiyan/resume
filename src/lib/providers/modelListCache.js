const DEFAULT_TTL_MS = 10 * 60 * 1000;

const globalCache = globalThis.__providerModelListCache ?? {
  entries: new Map(),
};

if (!globalThis.__providerModelListCache) {
  globalThis.__providerModelListCache = globalCache;
}

function getEntry(providerId) {
  return globalCache.entries.get(providerId) || null;
}

export function getCachedProviderModels(providerId) {
  if (!providerId) {
    return null;
  }

  const entry = getEntry(providerId);
  if (!entry) {
    return null;
  }

  if (Date.now() >= entry.expiresAt) {
    globalCache.entries.delete(providerId);
    return null;
  }

  return {
    models: [...entry.models],
    cachedAt: entry.cachedAt,
    expiresAt: entry.expiresAt,
  };
}

export function setCachedProviderModels(providerId, models, ttlMs = DEFAULT_TTL_MS) {
  if (!providerId) {
    return;
  }

  globalCache.entries.set(providerId, {
    models: Array.isArray(models) ? [...models] : [],
    cachedAt: Date.now(),
    expiresAt: Date.now() + ttlMs,
  });
}

export function invalidateProviderModelCache(providerId) {
  if (!providerId) {
    return;
  }

  globalCache.entries.delete(providerId);
}

export function clearProviderModelCache() {
  globalCache.entries.clear();
}

export { DEFAULT_TTL_MS };
