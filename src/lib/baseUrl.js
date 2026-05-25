/**
 * Utility helper to get the application's base URL.
 * Falls back to local/production defaults if NEXT_PUBLIC_BASE_URL is not set.
 */
export function getBaseUrl() {
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }

  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000';
  }

  return 'https://hasanraiyan.me';
}
