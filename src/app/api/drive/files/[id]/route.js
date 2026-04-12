import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/auth/admin';
import connectDB from '@/lib/db';
import DriveFile from '@/models/DriveFile';
import StorageCredential from '@/models/StorageCredential';
import StorageFactory from '@/lib/storage/StorageFactory';

export async function DELETE(request, { params }) {
  const authResult = await requireAdminSession();
  if (authResult instanceof NextResponse) return authResult;

  await connectDB();
  try {
    const { id } = params;
    const file = await DriveFile.findById(id);
    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const cred = await StorageCredential.findById(file.credentialId);
    if (cred) {
      const provider = StorageFactory.getProvider(cred.provider, cred.credentials);
      try {
        await provider.delete(file.fileKey);
      } catch (err) {
        console.error('Failed to delete file from provider', err);
      }
    }

    await DriveFile.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
