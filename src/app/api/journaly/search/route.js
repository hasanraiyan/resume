import { NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/money-auth';
import { searchEntries } from '@/lib/apps/journaly/service/service';

export async function POST(request) {
  const session = await requireAdminAuth(request);
  if (typeof session !== 'object') return session;

  try {
    const { query, limit } = await request.json();
    if (!query) {
      return NextResponse.json({ success: false, message: 'Query is required' }, { status: 400 });
    }

    const results = await searchEntries(query, limit);
    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error('Semantic search failed:', error);
    return NextResponse.json(
      { success: false, message: 'Semantic search failed' },
      { status: 500 }
    );
  }
}
