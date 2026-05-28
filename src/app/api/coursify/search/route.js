import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import CoursifyResearch from '@/models/CoursifyResearch';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';

    if (!query.trim()) {
      return NextResponse.json({ success: true, results: [] });
    }

    await dbConnect();

    // Query active and public articles with a clean regex search
    const results = await CoursifyResearch.find({
      isPublic: true,
      deletedAt: null,
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { topic: { $regex: query, $options: 'i' } },
      ],
    })
      .select('title topic slug createdAt')
      .limit(8)
      .lean();

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error('[CoursifySearch] Error searching articles:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to search articles', results: [] },
      { status: 500 }
    );
  }
}
