import { NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/money-auth';
import { createEntry, getEntries } from '@/lib/apps/journaly/service/service';

export async function POST(request) {
  const session = await requireAdminAuth(request);
  if (typeof session !== 'object') return session;

  try {
    const payload = await request.json();
    const entry = await createEntry(payload);
    return NextResponse.json({ success: true, entry });
  } catch (error) {
    console.error('Failed to create entry:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create entry' },
      { status: 400 }
    );
  }
}

export async function GET(request) {
  const session = await requireAdminAuth(request);
  if (typeof session !== 'object') return session;

  try {
    const { searchParams } = new URL(request.url);
    const tag = searchParams.get('tag');
    const mood = searchParams.get('mood') ? parseInt(searchParams.get('mood')) : undefined;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')) : 50;
    const skip = searchParams.get('skip') ? parseInt(searchParams.get('skip')) : 0;

    const entries = await getEntries({ tag, mood, startDate, endDate, limit, skip });
    return NextResponse.json({ success: true, entries });
  } catch (error) {
    console.error('Failed to fetch entries:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch entries' },
      { status: 500 }
    );
  }
}
