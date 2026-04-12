import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/auth/admin';
import dbConnect from '@/lib/dbConnect';
import DriveFile from '@/models/DriveFile';
import StorageCredential from '@/models/StorageCredential';
import StorageFactory from '@/lib/storage/StorageFactory';

export async function POST(request) {
  const authResult = await requireAdminSession();
  if (authResult instanceof NextResponse) return authResult;

  await dbConnect();
  try {
    const { fileName, fileKey, url, mimeType, size, folderId, credentialId } = await request.json();

    const cred = await StorageCredential.findById(credentialId);
    if (!cred || cred.deleted) {
      return NextResponse.json({ error: 'Drive not found or deleted' }, { status: 404 });
    }

    const provider = StorageFactory.getProvider(cred.provider, cred.credentials);
    const fileCheck = await provider.getFile(fileKey);
    if (!fileCheck.exists) {
      return NextResponse.json(
        { error: 'File not found on storage provider. Please re-upload.' },
        { status: 404 }
      );
    }

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
