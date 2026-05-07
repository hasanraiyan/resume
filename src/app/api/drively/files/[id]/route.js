import { requireAdminAuth } from '@/lib/money-auth';
import {
  updateFile,
  softDeleteFile,
  permanentDeleteFile,
} from '@/lib/apps/drively/service/service';
import { NextResponse } from 'next/server';

export async function PATCH(request, { params }) {
  const auth = await requireAdminAuth(request);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;

  try {
    const body = await request.json();
    const file = await updateFile(id, body);
    return NextResponse.json({ success: true, file });
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
      await permanentDeleteFile(id);
    } else {
      await softDeleteFile(id);
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
