import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/auth/admin';
import connectDB from '@/lib/db';
import DriveFile from '@/models/DriveFile';

export async function POST(request) {
  const authResult = await requireAdminSession();
  if (authResult instanceof NextResponse) return authResult;

  await connectDB();
  try {
    const { fileName, fileKey, url, mimeType, size, folderId, credentialId } = await request.json();

    const file = await DriveFile.create({
      fileName,
      fileKey,
      url,
      mimeType,
      size,
      folderId: folderId || null,
      credentialId,
    });

    return NextResponse.json({ file }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
