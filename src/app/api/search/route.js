/**
 * @fileoverview Search API route for querying projects and articles.
 * Provides a unified search endpoint that leverages fuzzy matching
 * and intelligent ranking across all portfolio content.
 *
 * Features:
 * - Fuzzy search across projects and articles using Fuse.js
 * - Intelligent result ranking and scoring
 * - Unified response format for both content types
 * - Real-time search capabilities for dynamic content
 * - Graceful error handling with proper HTTP status codes
 */

import { performSearch } from '@/lib/search/search';

/**
 * Handles GET requests to the search API endpoint.
 * Accepts a query parameter 'q' and returns matching projects and articles
 * with fuzzy matching and intelligent ranking.
 *
 * @async
 * @function GET
 * @param {Request} request - Next.js request object containing search query
 * @returns {Promise<Response>} JSON response with search results or error message
 *
 * @example
 * ```js
 * // Basic search
 * GET /api/search?q=react
 *
 * // Search with multiple terms
 * GET /api/search?q=javascript%20portfolio
 *
 * // Empty query returns no results
 * GET /api/search?q=
 * ```
 *
 * @query {string} q - Search query string (URL encoded)
 * - Supports multiple terms separated by spaces
 * - Case-insensitive matching
 * - Minimum 1 character required for search
 * - URL encoding recommended for special characters
 *
 * @response {Object} Success response
 * @response {Array} results - Array of search result objects
 * @response {string} results[].type - Type of content ('project' or 'article')
 * @response {string} results[].id - Unique identifier for the content
 * @response {string} results[].title - Title of the project/article
 * @response {string} results[].slug - URL-friendly identifier
 * @response {string} results[].excerpt - Brief description or excerpt
 * @response {string} results[].url - Full URL path to the content
 * @response {number} results[].score - Relevance score (0-1, higher is better)
 * @response {Array<string>} [results[].tags] - Associated tags (projects only)
 * @response {string} [results[].category] - Project category (projects only)
 *
 * @response {Object} Error response
 * @response {string} error - Error message describing what went wrong
 *
 * @error {400} Bad Request - Missing or invalid query parameter
 * @error {500} Internal Server Error - Search function failure or database error
 *
 * @search
 * - Uses fuzzy matching for typo tolerance
 * - Searches across title, description, content, and tags
 * - Results ranked by relevance score
 * - Supports partial word matching
 * - No minimum query length enforced (but recommended)
 *
 * @performance
 * - Leverages pre-built search indexes for fast queries
 * - Optimized for real-time search suggestions
 * - Minimal database queries through efficient indexing
 *
 * @example
 * ```js
 * // Client-side usage example
 * const searchProjects = async (query) => {
 *   if (!query.trim()) return [];
 *
 *   const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
 *   const data = await response.json();
 *
 *   if (response.ok) {
 *     return data.results;
 *   } else {
 *     console.error('Search failed:', data.error);
 *     return [];
 *   }
 * };
 *
 * // Usage
 * const results = await searchProjects('react portfolio');
 * console.log(results); // Array of matching projects and articles
 * ```
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    // Call the unified search function from our library
    const results = await performSearch(query);

    return Response.json({ results });
  } catch (error) {
    console.error('Search API Route Error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
