import { requireAdminAuth } from '@/lib/money-auth';
import { emptyTrash } from '@/lib/apps/drively/service/service';
import { NextResponse } from 'next/server';

export async function DELETE(request) {
  const auth = await requireAdminAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    await emptyTrash();
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
