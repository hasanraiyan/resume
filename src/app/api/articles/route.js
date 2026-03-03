import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Article from '@/models/Article';

// GET /api/articles — Return all published article titles and slugs
export async function GET() {
  try {
    await dbConnect();

    const articles = await Article.find(
      { status: 'published', visibility: 'public' },
      'title slug excerpt tags publishedAt'
    )
      .sort({ publishedAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      count: articles.length,
      articles: articles.map((a) => ({
        title: a.title,
        slug: a.slug,
        excerpt: a.excerpt || '',
        tags: a.tags || [],
        publishedAt: a.publishedAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching articles list:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
