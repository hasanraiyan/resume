import crypto from 'crypto';

/**
 * Normalize a prompt/topic for consistent hashing
 * Removes extra whitespace, lowercases, removes punctuation
 */
function normalizePrompt(input) {
  return input
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, '');
}

/**
 * Generate a SHA-256 hash of a normalized prompt
 */
export function hashPrompt(topic, isReferenceEnabled = false) {
  const normalized = normalizePrompt(topic);
  const fullPrompt = `${normalized}|ref=${isReferenceEnabled}`;
  return crypto.createHash('sha256').update(fullPrompt).digest('hex');
}

/**
 * Check if two topics are semantically similar (fuzzy match)
 * Returns true if similarity >= threshold (0.85 = 85%)
 */
export function areTopicsSimilar(topic1, topic2, threshold = 0.85) {
  const norm1 = normalizePrompt(topic1);
  const norm2 = normalizePrompt(topic2);

  if (norm1 === norm2) return true;

  // Levenshtein distance for fuzzy matching
  const similarity = levenshteinSimilarity(norm1, norm2);
  return similarity >= threshold;
}

/**
 * Calculate similarity ratio using Levenshtein distance (0-1)
 */
function levenshteinSimilarity(str1, str2) {
  const distance = levenshteinDistance(str1, str2);
  const maxLength = Math.max(str1.length, str2.length);
  return 1 - distance / maxLength;
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1, str2) {
  const matrix = Array(str2.length + 1)
    .fill(null)
    .map(() => Array(str1.length + 1).fill(0));

  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }

  return matrix[str2.length][str1.length];
}

export default { hashPrompt, areTopicsSimilar };
