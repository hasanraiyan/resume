import { requireAdminAuth } from '@/lib/money-auth';
import { createFolder } from '@/lib/apps/drively/service/service';
import { NextResponse } from 'next/server';

export async function POST(request) {
  const auth = await requireAdminAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const folder = await createFolder(body);
    return NextResponse.json({ success: true, folder });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
