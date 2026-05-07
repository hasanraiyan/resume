import { requireAdminAuth } from '@/lib/money-auth';
import { getBootstrapData } from '@/lib/apps/drively/service/service';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const auth = await requireAdminAuth(request);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(request.url);
  const includeTrash = searchParams.get('trash') === 'true';

  try {
    if (includeTrash) {
      const { getTrash } = await import('@/lib/apps/drively/service/service');
      const data = await getTrash();
      return NextResponse.json({ success: true, ...data });
    }
    const data = await getBootstrapData();
    return NextResponse.json({ success: true, ...data });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
