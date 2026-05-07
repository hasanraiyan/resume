import { requireAdminAuth } from '@/lib/money-auth';
import { createOrGetShare, revokeShare } from '@/lib/apps/drively/service/service';
import { NextResponse } from 'next/server';

export async function POST(request, { params }) {
  const auth = await requireAdminAuth(request);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;

  try {
    const share = await createOrGetShare(id);
    const url = `${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/drively/public/${share.token}`;
    return NextResponse.json({ success: true, ...share, url });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const auth = await requireAdminAuth(request);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;

  try {
    await revokeShare(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
