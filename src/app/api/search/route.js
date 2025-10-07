import dbConnect from '@/lib/dbConnect';
import Project from '@/models/Project';
import Article from '@/models/Article';
import Fuse from 'fuse.js';
import { Filter } from 'bad-words';

export async function GET(request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    // Instantiate the profanity filter
    const filter = new Filter();

    // Check for profanity in the query
    if (query && filter.isProfane(query)) {
      // If profane language is found, return empty results immediately
      return Response.json({ results: [] });
    }

    if (!query || query.length < 3) {
      return Response.json({ results: [] });
    }

    // 1. Fetch all searchable content from the database
    const [projectResults, articleResults] = await Promise.all([
      Project.find({}).select('slug title description category tags').lean(),
      Article.find({ status: 'published' }).select('slug title excerpt tags').lean(),
    ]);

    // 2. Prepare the data for Fuse.js
    const searchableData = [
      ...projectResults.map((project) => ({
        ...project,
        type: 'project',
      })),
      ...articleResults.map((article) => ({
        ...article,
        type: 'article',
        // Use 'excerpt' as the 'description' for consistent searching
        description: article.excerpt,
      })),
    ];

    // 3. Configure and run Fuse.js search
    const fuseOptions = {
      includeScore: true,
      threshold: 0.4, // Adjust for more/less fuzzy matching (0.0 is exact, 1.0 is all)
      keys: [
        { name: 'title', weight: 0.7 }, // Title matches are most important
        { name: 'tags.name', weight: 0.5 }, // Tag matches are important
        { name: 'tags', weight: 0.5 }, // Also search raw string tags
        { name: 'category', weight: 0.4 },
        { name: 'description', weight: 0.3 }, // Description/excerpt is less important
        { name: 'excerpt', weight: 0.3 },
      ],
    };

    const fuse = new Fuse(searchableData, fuseOptions);
    const fuseResults = fuse.search(query);

    // 4. Format results for the frontend
    const results = fuseResults.map((result) => ({
      id: result.item._id,
      title: result.item.title,
      slug: result.item.slug,
      excerpt: result.item.description || result.item.excerpt,
      type: result.item.type,
      score: 1 - result.score, // Invert score so higher is better
      category: result.item.category,
      tags: result.item.tags,
    }));

    return Response.json({ results });
  } catch (error) {
    console.error('Search error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
