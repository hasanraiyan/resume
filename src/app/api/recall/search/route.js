import { NextResponse } from 'next/server';
import { searchRecallMemories } from '@/lib/recall/memory-service';

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const query = url.searchParams.get('q');
    const limit = parseInt(url.searchParams.get('limit') || '10', 10);

    const memories = await searchRecallMemories(query, limit);

    return NextResponse.json({ memories });
  } catch (error) {
    console.error('[ReCall Search] Error:', error);
    const status = error.message === 'Search query is required' ? 400 : 500;
    return NextResponse.json({ error: 'Search failed', details: error.message }, { status });
  }
}
