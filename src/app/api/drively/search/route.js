import { requireAdminAuth } from '@/lib/money-auth';
import { searchDrively } from '@/lib/apps/drively/service/service';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const auth = await requireAdminAuth(request);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({ success: true, files: [], folders: [] });
  }

  try {
    const results = await searchDrively(query);
    return NextResponse.json({ success: true, ...results });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
