import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import StorageCredential from '@/models/StorageCredential';
import DriveFile from '@/models/DriveFile';
import DriveFolder from '@/models/DriveFolder';
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

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || secret !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();
  try {
    const deletedCreds = await StorageCredential.find({ deleted: true });
    let totalFilesDeleted = 0;
    let totalFoldersDeleted = 0;
    let errors = [];

    for (const cred of deletedCreds) {
      const provider = StorageFactory.getProvider(cred.provider, cred.credentials);

      const files = await DriveFile.find({ credentialId: cred._id });
      for (const file of files) {
        try {
          await provider.delete(file.fileKey);
        } catch (e) {
          errors.push(`File ${file.fileKey}: ${e.message}`);
        }
      }
      await DriveFile.deleteMany({ credentialId: cred._id });
      totalFilesDeleted += files.length;

      const rootFolders = await DriveFolder.find({ credentialId: cred._id, parentId: null });
      for (const folder of rootFolders) {
        await deleteFolderRecursive(folder, provider);
      }
      await DriveFolder.deleteMany({ credentialId: cred._id });
      totalFoldersDeleted += rootFolders.length;

      await StorageCredential.findByIdAndDelete(cred._id);
    }

    return NextResponse.json({
      success: true,
      cleaned: {
        credentials: deletedCreds.length,
        files: totalFilesDeleted,
        folders: totalFoldersDeleted,
      },
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
