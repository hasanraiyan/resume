/**
 * @fileoverview Shared utility functions for analytics processing.
 */

/**
 * List of known bot user agents to filter out from analytics tracking.
 * Used to maintain data quality by excluding automated traffic from bots,
 * crawlers, and monitoring services.
 *
 * @constant {Array<string>}
 */
export const BOT_USER_AGENTS = [
  'bot',
  'spider',
  'crawler',
  'scraper',
  'monitoring',
  'check',
  'wget',
  'curl',
  'python-requests',
  'go-http-client',
  'java',
  'okhttp',
  'axios',
  'node-fetch',
  'facebookexternalhit',
  'twitterbot',
  'linkedinbot',
  'whatsapp',
  'telegrambot',
  'discordbot',
];

/**
 * Determines if a user agent string belongs to a bot or automated service.
 * Performs case-insensitive matching against known bot patterns to filter
 * out non-human traffic from analytics data.
 *
 * @function isBot
 * @param {string} userAgent - The User-Agent header string from the request
 * @returns {boolean} True if the user agent matches known bot patterns, false otherwise
 */
export function isBot(userAgent) {
  if (!userAgent) return false;

  const ua = userAgent.toLowerCase();
  return BOT_USER_AGENTS.some((bot) => ua.includes(bot));
}

/**
 * Creates a hash of an IP address for privacy-compliant geographical analysis.
 * Converts IP addresses to anonymized hashes that can be used for location-based
 * analytics without storing personally identifiable information.
 *
 * Uses a simple djb2-style hash algorithm to create consistent, anonymized
 * identifiers from IP addresses while maintaining reasonable distribution.
 *
 * @function hashIP
 * @param {string} ip - The IP address to hash
 * @returns {string|null} Hashed IP as base-36 string, or null if input is falsy
 */
export function hashIP(ip) {
  // Simple hash for geographical analysis without storing full IP
  if (!ip) return null;

  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    const char = ip.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}
