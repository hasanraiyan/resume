import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/auth/admin';
import dbConnect from '@/lib/dbConnect';
import DriveFolder from '@/models/DriveFolder';
import DriveFile from '@/models/DriveFile';
import StorageCredential from '@/models/StorageCredential';
import StorageFactory from '@/lib/storage/StorageFactory';

async function deleteFolderRecursive(folder, provider) {
  const subfolders = await DriveFolder.find({ parentId: folder._id });
  for (const subfolder of subfolders) {
    await deleteFolderRecursive(subfolder, provider);
  }
  const files = await DriveFile.find({ folderId: folder._id });
  for (const file of files) {
    try {
      await provider.delete(file.fileKey);
    } catch (e) {
      console.error(`Failed to delete file from provider: ${file.fileKey}`, e);
    }
  }
  await DriveFile.deleteMany({ folderId: folder._id });
  await DriveFolder.findByIdAndDelete(folder._id);
}

export async function DELETE(request, { params }) {
  const authResult = await requireAdminSession();
  if (authResult instanceof NextResponse) return authResult;

  await dbConnect();
  try {
    const { id } = params;

    const folder = await DriveFolder.findById(id);
    if (!folder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    const cred = await StorageCredential.findById(folder.credentialId);
    if (!cred || cred.deleted) {
      return NextResponse.json({ error: 'Drive not found or deleted' }, { status: 404 });
    }

    const provider = StorageFactory.getProvider(cred.provider, cred.credentials);
    await deleteFolderRecursive(folder, provider);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
