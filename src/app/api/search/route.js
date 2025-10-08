/**
 * @fileoverview Search API route for querying projects and articles.
 * Provides a unified search endpoint that leverages fuzzy matching
 * and intelligent ranking across all portfolio content.
 */

// src/app/api/search/route.js

import { performSearch } from '@/lib/search/search';

/**
 * Handles GET requests to the search API endpoint.
 * Accepts a query parameter 'q' and returns matching projects and articles.
 *
 * @async
 * @function GET
 * @param {Request} request - Next.js request object
 * @returns {Promise<Response>} JSON response with search results or error
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
