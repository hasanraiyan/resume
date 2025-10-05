import dbConnect from '@/lib/dbConnect';
import Project from '@/models/Project';
import Article from '@/models/Article';
export async function GET(request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    // Validate query parameter
    if (!query || query.length < 3) {
      return Response.json({ results: [] });
    }

    // Execute parallel searches
    const [projectResults, articleResults] = await Promise.all([
      // Search projects
      Project.find(
        { $text: { $search: query } },
        { score: { $meta: 'textScore' } }
      )
        .select('slug title description category tags')
        .sort({ score: { $meta: 'textScore' } })
        .limit(20),

      // Search articles (only published ones)
      Article.find(
        {
          $text: { $search: query },
          status: 'published'
        },
        { score: { $meta: 'textScore' } }
      )
        .select('slug title excerpt tags')
        .sort({ score: { $meta: 'textScore' } })
        .limit(20)
    ]);

    // Transform results to unified format
    const results = [
      ...projectResults.map(project => ({
        id: project._id,
        title: project.title,
        slug: project.slug,
        excerpt: project.description,
        type: 'project',
        score: project.score,
        category: project.category,
        tags: project.tags
      })),
      ...articleResults.map(article => ({
        id: article._id,
        title: article.title,
        slug: article.slug,
        excerpt: article.excerpt,
        type: 'article',
        score: article.score,
        tags: article.tags
      }))
    ];

    // Sort by relevance score
    results.sort((a, b) => b.score - a.score);

    return Response.json({ results });
  } catch (error) {
    console.error('Search error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
