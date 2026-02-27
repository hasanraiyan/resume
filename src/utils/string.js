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
