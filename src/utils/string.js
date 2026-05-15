/**
 * @fileoverview Shared string utility functions.
 */

/**
 * Generates initials from a full name string.
 * e.g. "Raiyan Hasan" → "RH"
 *
 * @param {string} [name=''] - Full name
 * @returns {string} Uppercase initials
 */
export function getInitials(name = '') {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

/**
 * Slugifies a string.
 * e.g. "Dijkstra's Algorithm" → "dijkstras-algorithm"
 */
export function slugify(text = '') {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w-]+/g, '') // Remove all non-word chars
    .replace(/--+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text
}
