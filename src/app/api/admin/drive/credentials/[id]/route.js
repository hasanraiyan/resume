import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/auth/admin';
import dbConnect from '@/lib/dbConnect';
import StorageCredential from '@/models/StorageCredential';
import DriveFile from '@/models/DriveFile';
import DriveFolder from '@/models/DriveFolder';
import StorageFactory from '@/lib/storage/StorageFactory';

async function deleteFolderRecursive(folderId, provider) {
  const subfolders = await DriveFolder.find({ parentId: folderId });
  for (const subfolder of subfolders) {
    await deleteFolderRecursive(subfolder._id, provider);
  }
  const files = await DriveFile.find({ folderId: folderId });
  for (const file of files) {
    try {
      await provider.delete(file.fileKey);
    } catch (e) {
      console.error(`Failed to delete file from provider: ${file.fileKey}`, e);
    }
  }
  await DriveFile.deleteMany({ folderId: folderId });
  await DriveFolder.findByIdAndDelete(folderId);
}

export async function DELETE(request, { params }) {
  const authResult = await requireAdminSession();
  if (authResult instanceof NextResponse) return authResult;

  await dbConnect();
  try {
    const { id } = params;
    const cred = await StorageCredential.findById(id);
    if (!cred) {
      return NextResponse.json({ error: 'Credential not found' }, { status: 404 });
    }

    const provider = StorageFactory.getProvider(cred.provider, cred.credentials);

    const files = await DriveFile.find({ credentialId: id });
    for (const file of files) {
      try {
        await provider.delete(file.fileKey);
      } catch (e) {
        console.error(`Failed to delete file from provider: ${file.fileKey}`, e);
      }
    }
    await DriveFile.deleteMany({ credentialId: id });

    const rootFolders = await DriveFolder.find({ credentialId: id, parentId: null });
    for (const folder of rootFolders) {
      await deleteFolderRecursive(folder._id, provider);
    }
    await DriveFolder.deleteMany({ credentialId: id });

    cred.deleted = true;
    cred.deletedAt = new Date();
    await cred.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
