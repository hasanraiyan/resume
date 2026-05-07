import { NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/money-auth';
import { getEntryById, updateEntry, deleteEntry } from '@/lib/apps/journaly/service/service';

export async function GET(request, { params }) {
  const session = await requireAdminAuth(request);
  if (typeof session !== 'object') return session;

  const { id } = params;
  try {
    const entry = await getEntryById(id);
    if (!entry) {
      return NextResponse.json({ success: false, message: 'Entry not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, entry });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  const session = await requireAdminAuth(request);
  if (typeof session !== 'object') return session;

  const { id } = params;
  try {
    const payload = await request.json();
    const entry = await updateEntry(id, payload);
    return NextResponse.json({ success: true, entry });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}

export async function DELETE(request, { params }) {
  const session = await requireAdminAuth(request);
  if (typeof session !== 'object') return session;

  const { id } = params;
  try {
    await deleteEntry(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
