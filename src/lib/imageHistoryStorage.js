const STORAGE_KEY = 'ai-image-history-v1';
const MAX_HISTORY_ITEMS = 12;
const MAX_STORED_IMAGE_DIMENSION = 768;
const COMPRESSED_IMAGE_QUALITY = 0.78;

const isQuotaExceededError = (error) => {
  if (!error) return false;
  return (
    error.name === 'QuotaExceededError' ||
    error.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
    error.code === 22
  );
};

const createId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const normalizeItem = (item) => {
  if (!item || typeof item !== 'object') return null;
  if (typeof item.imageDataUrl !== 'string' || !item.imageDataUrl) return null;

  return {
    id: typeof item.id === 'string' ? item.id : createId(),
    imageDataUrl: item.imageDataUrl,
    prompt: typeof item.prompt === 'string' ? item.prompt : '',
    mode: item.mode === 'edit' ? 'edit' : 'generate',
    aspectRatio:
      item.aspectRatio === '1:1' || item.aspectRatio === '16:9' || item.aspectRatio === '9:16'
        ? item.aspectRatio
        : 'n/a',
    source: item.source === 'teaser' ? 'teaser' : 'playground',
    createdAt: typeof item.createdAt === 'number' ? item.createdAt : Date.now(),
  };
};

const writeHistory = (items) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
};

const compressDataUrlImage = async (imageDataUrl) => {
  if (typeof window === 'undefined') return imageDataUrl;
  if (typeof imageDataUrl !== 'string' || !imageDataUrl.startsWith('data:image/')) {
    return imageDataUrl;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const scale = Math.min(
          1,
          MAX_STORED_IMAGE_DIMENSION / Math.max(img.naturalWidth, img.naturalHeight)
        );
        const width = Math.max(1, Math.round(img.naturalWidth * scale));
        const height = Math.max(1, Math.round(img.naturalHeight * scale));

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(imageDataUrl);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        const webp = canvas.toDataURL('image/webp', COMPRESSED_IMAGE_QUALITY);
        const jpeg = canvas.toDataURL('image/jpeg', COMPRESSED_IMAGE_QUALITY);
        const candidates = [webp, jpeg].filter(
          (candidate) => typeof candidate === 'string' && candidate.startsWith('data:image/')
        );
        if (candidates.length === 0) {
          resolve(imageDataUrl);
          return;
        }

        const smallestCandidate = candidates.sort((a, b) => a.length - b.length)[0];
        resolve(smallestCandidate.length < imageDataUrl.length ? smallestCandidate : imageDataUrl);
      } catch {
        resolve(imageDataUrl);
      }
    };

    img.onerror = () => resolve(imageDataUrl);
    img.src = imageDataUrl;
  });
};

export const readImageHistory = () => {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map(normalizeItem)
      .filter(Boolean)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, MAX_HISTORY_ITEMS);
  } catch {
    return [];
  }
};

export const pushImageHistory = async (item) => {
  const normalized = normalizeItem(item);
  if (!normalized) return readImageHistory();

  const compressedImage = await compressDataUrlImage(normalized.imageDataUrl);
  const normalizedItem = { ...normalized, imageDataUrl: compressedImage };

  const existing = readImageHistory();
  const deduped = existing.filter((entry) => entry.imageDataUrl !== normalizedItem.imageDataUrl);
  const nextItems = [normalizedItem, ...deduped].slice(0, MAX_HISTORY_ITEMS);

  try {
    writeHistory(nextItems);
    return nextItems;
  } catch (error) {
    if (!isQuotaExceededError(error)) return existing;

    // Retry once after pruning oldest entries first.
    const prunedItems = nextItems.slice(0, Math.max(1, nextItems.length - 1));
    try {
      writeHistory(prunedItems);
      return prunedItems;
    } catch {
      return existing;
    }
  }
};

export const clearImageHistory = () => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Non-fatal: ignore storage errors for UX continuity.
  }
};

export const removeImageHistoryItem = (itemId) => {
  if (typeof window === 'undefined') return [];
  if (typeof itemId !== 'string' || !itemId) return readImageHistory();

  const existing = readImageHistory();
  const nextItems = existing.filter((entry) => entry.id !== itemId);

  try {
    if (nextItems.length === 0) {
      window.localStorage.removeItem(STORAGE_KEY);
    } else {
      writeHistory(nextItems);
    }
    return nextItems;
  } catch {
    return existing;
  }
};
