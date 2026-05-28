import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import CoursifyResearch from '@/models/CoursifyResearch';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';

    await dbConnect();

    // If query is empty, dynamically return the 5 most recently created public research articles
    if (!query.trim()) {
      const latest = await CoursifyResearch.find({
        isPublic: true,
        deletedAt: null,
      })
        .sort({ createdAt: -1 })
        .select('title slug')
        .limit(5)
        .lean();
      return NextResponse.json({ success: true, results: [], latest });
    }

    let results = [];
    const cleanQuery = query.trim();

    // 1. High-Performance MongoDB Indexed Text Search (Fastest: ~1-3ms)
    if (cleanQuery.length >= 3) {
      results = await CoursifyResearch.find(
        {
          isPublic: true,
          deletedAt: null,
          $text: { $search: cleanQuery },
        },
        { score: { $meta: 'textScore' } }
      )
        .sort({ score: { $meta: 'textScore' } })
        .select('title slug createdAt')
        .limit(8)
        .lean();
    }

    // 2. Regex Search Fallback (for partial/incomplete words, e.g. "net" -> "networking")
    if (results.length === 0) {
      results = await CoursifyResearch.find({
        isPublic: true,
        deletedAt: null,
        $or: [
          { title: { $regex: cleanQuery, $options: 'i' } },
          { topic: { $regex: cleanQuery, $options: 'i' } },
        ],
      })
        .select('title slug createdAt')
        .limit(8)
        .lean();
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error('[CoursifySearch] Error searching articles:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to search articles', results: [] },
      { status: 500 }
    );
  }
}
