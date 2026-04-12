import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/auth/admin';
import connectDB from '@/lib/db';
import DriveFolder from '@/models/DriveFolder';
import DriveFile from '@/models/DriveFile';

export async function GET(request) {
  const authResult = await requireAdminSession();
  if (authResult instanceof NextResponse) return authResult;

  await connectDB();
  const { searchParams } = new URL(request.url);
  const parentId = searchParams.get('parentId');
  const credentialId = searchParams.get('credentialId');

  try {
    const query = {};
    if (parentId && parentId !== 'null') query.parentId = parentId;
    else query.parentId = null;

    if (credentialId) query.credentialId = credentialId;

    const folders = await DriveFolder.find(query).sort({ name: 1 });
    const files = await DriveFile.find({ folderId: query.parentId, credentialId }).sort({ fileName: 1 });

    return NextResponse.json({ folders, files });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  const authResult = await requireAdminSession();
  if (authResult instanceof NextResponse) return authResult;

  await connectDB();
  try {
    const { name, parentId, credentialId } = await request.json();
    const folder = await DriveFolder.create({
      name,
      parentId: parentId || null,
      credentialId,
    });
    return NextResponse.json({ folder }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
