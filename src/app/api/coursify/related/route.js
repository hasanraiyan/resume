import { NextResponse } from 'next/server';
import { getRelatedArticles } from '@/lib/coursify/related';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (!slug) {
      return NextResponse.json({ error: 'slug required' }, { status: 400 });
    }

    // Get related articles WITH snippets for consistent data structure
    const related = await getRelatedArticles(slug, 4, true);

    console.log(`[CoursifyRelated] Found ${related.length} related articles for ${slug}`);

    return NextResponse.json({ related, success: true });
  } catch (error) {
    console.error('[CoursifyRelated] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch related articles', related: [] },
      { status: 500 }
    );
  }
}
