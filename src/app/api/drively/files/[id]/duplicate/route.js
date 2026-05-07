import { requireAdminAuth } from '@/lib/money-auth';
import { duplicateFile } from '@/lib/apps/drively/service/service';
import { NextResponse } from 'next/server';

export async function POST(request, { params }) {
  const auth = await requireAdminAuth(request);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;

  try {
    const file = await duplicateFile(id);
    return NextResponse.json({ success: true, file });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
