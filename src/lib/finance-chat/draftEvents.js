export const SAVED_TRANSACTION_EVENT = 'pocketly-last-saved-tx';
export const SAVED_TRANSACTION_STORAGE_KEY = 'pocketly-last-saved-tx';

export function broadcastSavedTransaction(payload) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(SAVED_TRANSACTION_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore private browsing and quota failures; the same-tab event still updates the UI.
  }

  window.dispatchEvent(new CustomEvent(SAVED_TRANSACTION_EVENT, { detail: payload }));
}
