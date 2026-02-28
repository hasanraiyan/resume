/**
 * @fileoverview Unified search functionality for projects and articles.
 *
 * Provides intelligent, fuzzy search capabilities across all portfolio content
 * using Fuse.js for advanced text matching. Includes profanity filtering and
 * comprehensive result formatting with relevance scoring.
 *
 * Features:
 * - Fuzzy text matching with configurable thresholds
 * - Unified search across projects and articles
 * - Profanity filtering for safe search
 * - Weighted search results by relevance
 * - URL generation for search results
 *
 * @example
 * ```js
 * import { performSearch } from '@/lib/search/search';
 *
 * // Basic search
 * const results = await performSearch('React projects');
 * console.log(results); // Array of formatted search results
 *
 * // Search with filtering
 * if (results.length > 0) {
 *   const projects = results.filter(r => r.type === 'project');
 *   const articles = results.filter(r => r.type === 'article');
 * }
 * ```
 */

// src/lib/search.js

import dbConnect from '@/lib/dbConnect';
import Project from '@/models/Project';
import Article from '@/models/Article';
import Fuse from 'fuse.js';
import { Filter } from 'bad-words';

/**
 * Search Result Interface
 * @typedef {Object} SearchResult
 * @property {string} id - Unique identifier for the result
 * @property {string} title - Title of the project or article
 * @property {string} slug - URL-friendly identifier
 * @property {string} excerpt - Brief description or excerpt
 * @property {'project'|'article'} type - Type of content
 * @property {number} score - Relevance score (0-1, higher is better)
 * @property {string} [category] - Project category (for projects only)
 * @property {Array} [tags] - Associated tags
 * @property {string} url - Full URL to the content
 */

/**
 * Fuse.js configuration options for search optimization.
 * @constant {Object}
 */
const FUSE_OPTIONS = {
  includeScore: true,
  threshold: 0.4, // Fuzzy matching tolerance (0 = exact match, 1 = match anything)
  keys: [
    { name: 'title', weight: 0.7 }, // Title matches are most important
    { name: 'tags.name', weight: 0.5 }, // Tag matches are moderately important
    { name: 'tags', weight: 0.5 }, // Fallback for tag arrays
    { name: 'category', weight: 0.4 }, // Category matches
    { name: 'description', weight: 0.3 }, // Description matches
    { name: 'excerpt', weight: 0.3 }, // Article excerpt matches
  ],
};

/**
 * Performs a unified, fuzzy search across all projects and articles.
 *
 * This function serves as the single source of truth for search functionality
 * in the application. It combines data from both projects and articles, applies
 * intelligent fuzzy matching using Fuse.js, and returns formatted results with
 * relevance scoring and proper URL generation.
 *
 * Search Process:
 * 1. Validates query (minimum length, profanity check)
 * 2. Fetches all searchable content from database
 * 3. Applies fuzzy search with weighted scoring
 * 4. Formats results with URLs and metadata
 *
 * @async
 * @function performSearch
 * @param {string} query - The search query from the user (minimum 2 characters)
 * @param {boolean} isAuthenticated - Whether the user is authenticated (default: false)
 * @returns {Promise<SearchResult[]>} Promise that resolves to an array of formatted search results
 *
 * @example
 * ```js
 * // Basic search usage
 * const results = await performSearch('React');
 * console.log(`Found ${results.length} results`);
 *
 * // Process results by type
 * results.forEach(result => {
 *   console.log(`${result.type}: ${result.title} (${result.score})`);
 *   console.log(`URL: ${result.url}`);
 * });
 *
 * // Filter for specific content types
 * const projects = results.filter(r => r.type === 'project');
 * const articles = results.filter(r => r.type === 'article');
 *
 * // Handle empty results
 * if (results.length === 0) {
 *   console.log('No results found');
 * }
 * ```
 */
export async function performSearch(query, isAuthenticated = false) {
  try {
    // Instantiate and check for profanity
    const filter = new Filter();
    if (!query || query.length < 2 || filter.isProfane(query)) {
      return [];
    }

    await dbConnect();

    // 1. Fetch all searchable content from the database
    const visibilityFilter = isAuthenticated
      ? { $in: ['public', 'private', 'unlisted'] }
      : 'public';
    const [projectResults, articleResults] = await Promise.all([
      Project.find({}).select('slug title description category tags thumbnail').lean(),
      Article.find({ status: 'published', visibility: visibilityFilter })
        .select('slug title excerpt tags visibility coverImage')
        .lean(),
    ]);

    // 2. Prepare the data for Fuse.js
    const searchableData = [
      ...projectResults.map((project) => ({ ...project, type: 'project' })),
      ...articleResults.map((article) => ({
        ...article,
        type: 'article',
        description: article.excerpt, // Use 'excerpt' for consistent searching
      })),
    ];

    // 3. Configure and run Fuse.js search
    const fuseOptions = {
      includeScore: true,
      threshold: 0.4, // Fuzzy matching tolerance
      keys: [
        { name: 'title', weight: 0.7 },
        { name: 'tags.name', weight: 0.5 },
        { name: 'tags', weight: 0.5 },
        { name: 'category', weight: 0.4 },
        { name: 'description', weight: 0.3 },
        { name: 'excerpt', weight: 0.3 },
      ],
    };

    const fuse = new Fuse(searchableData, fuseOptions);
    const fuseResults = fuse.search(query);

    // 4. Format and return results with URLs
    const results = fuseResults.map((result) => ({
      id: result.item._id.toString(), // Ensure ID is a string
      title: result.item.title,
      slug: result.item.slug,
      excerpt: result.item.description || result.item.excerpt,
      type: result.item.type,
      score: 1 - result.score, // Invert score so higher is better
      category: result.item.category,
      tags: result.item.tags,
      thumbnail: result.item.thumbnail || result.item.coverImage,
      url:
        result.item.type === 'project'
          ? `/projects/${result.item.slug}`
          : `/blog/${result.item.slug}`, // Add URL
    }));

    return results;
  } catch (error) {
    console.error('Unified Search Error:', error);
    // Return an empty array on error to prevent crashes
    return [];
  }
}
