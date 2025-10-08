// src/lib/search.js

import dbConnect from '@/lib/dbConnect';
import Project from '@/models/Project';
import Article from '@/models/Article';
import Fuse from 'fuse.js';
import { Filter } from 'bad-words';

/**
 * Performs a unified, fuzzy search across all projects and articles.
 * This function is the single source of truth for search logic in the application.
 * @param {string} query The search query from the user.
 * @returns {Promise<Array>} A promise that resolves to an array of formatted search results.
 */
export async function performSearch(query) {
  try {
    // Instantiate and check for profanity
    const filter = new Filter();
    if (!query || query.length < 2 || filter.isProfane(query)) {
      return [];
    }

    await dbConnect();

    // 1. Fetch all searchable content from the database
    const [projectResults, articleResults] = await Promise.all([
      Project.find({}).select('slug title description category tags').lean(),
      Article.find({ status: 'published' }).select('slug title excerpt tags').lean(),
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

    // 4. Format and return results
    const results = fuseResults.map((result) => ({
      id: result.item._id.toString(), // Ensure ID is a string
      title: result.item.title,
      slug: result.item.slug,
      excerpt: result.item.description || result.item.excerpt,
      type: result.item.type,
      score: 1 - result.score, // Invert score so higher is better
      category: result.item.category,
      tags: result.item.tags,
    }));

    return results;
  } catch (error) {
    console.error('Unified Search Error:', error);
    // Return an empty array on error to prevent crashes
    return [];
  }
}
