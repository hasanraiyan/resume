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

export async function performSearch(query, isAuthenticated = false, type = null) {
  try {
    const filter = new Filter();
    if (!query || query.length < 2 || filter.isProfane(query)) {
      return [];
    }

    await dbConnect();

    const visibilityFilter = isAuthenticated
      ? { $in: ['public', 'private', 'unlisted'] }
      : 'public';

    const fetchers = [];

    if (!type || type === 'project') {
      fetchers.push(
        Project.find({}).select('slug title description category tags thumbnail').lean()
      );
    } else {
      fetchers.push(Promise.resolve([]));
    }

    if (!type || type === 'article') {
      fetchers.push(
        Article.find({ status: 'published', visibility: visibilityFilter })
          .select('slug title excerpt tags visibility coverImage')
          .lean()
      );
    } else {
      fetchers.push(Promise.resolve([]));
    }

    const [projectResults, articleResults] = await Promise.all(fetchers);

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
      difficulty: result.item.difficulty,
      thumbnail: result.item.thumbnail || result.item.coverImage,
      url:
        result.item.type === 'project'
          ? `/projects/${result.item.slug}`
          : `/blog/${result.item.slug}`, // Add URL
    }));

    return results;
  } catch (error) {
    console.error('Unified Search Error:', error);
    return [];
  }
}
