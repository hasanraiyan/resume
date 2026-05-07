import { requireAdminAuth } from '@/lib/money-auth';
import {
  updateFolder,
  softDeleteFolder,
  permanentDeleteFolder,
} from '@/lib/apps/drively/service/service';
import { NextResponse } from 'next/server';

export async function PATCH(request, { params }) {
  const auth = await requireAdminAuth(request);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;

  try {
    const body = await request.json();
    const folder = await updateFolder(id, body);
    return NextResponse.json({ success: true, folder });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const auth = await requireAdminAuth(request);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const permanent = searchParams.get('permanent') === 'true';

  try {
    if (permanent) {
      await permanentDeleteFolder(id);
    } else {
      await softDeleteFolder(id);
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
