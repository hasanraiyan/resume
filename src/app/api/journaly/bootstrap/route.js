import { NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/money-auth';
import { getEntries, getJournalStats, getAllTags } from '@/lib/apps/journaly/service/service';

export async function GET(request) {
  const session = await requireAdminAuth(request);
  if (typeof session !== 'object') return session;

  try {
    const [entries, stats, tags] = await Promise.all([
      getEntries({ limit: 50 }),
      getJournalStats(),
      getAllTags(),
    ]);

    return NextResponse.json({
      success: true,
      entries,
      stats,
      tags,
    });
  } catch (error) {
    console.error('Failed to bootstrap Journaly:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch journal data' },
      { status: 500 }
    );
  }
}
