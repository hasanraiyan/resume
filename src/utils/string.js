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

/**
 * Formats a 24-hour time string (e.g. "15:00" or "09:00") to 12-hour format with am/pm.
 * e.g. "15:00" → "3:00 pm", "09:30" → "9:30 am"
 *
 * @param {string} [timeStr=''] - 24-hour time string
 * @returns {string} Formatted 12-hour time string
 */
export function formatTime12H(timeStr = '') {
  if (!timeStr) return '';
  const [hoursStr, minutesStr] = timeStr.split(':');
  let hours = parseInt(hoursStr, 10);
  const minutes = minutesStr || '00';
  if (isNaN(hours)) return timeStr;
  const ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  return `${hours}:${minutes} ${ampm}`;
}
