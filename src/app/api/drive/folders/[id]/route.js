import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/auth/admin';
import dbConnect from '@/lib/dbConnect';
import DriveFolder from '@/models/DriveFolder';
import DriveFile from '@/models/DriveFile';

export async function DELETE(request, { params }) {
  const authResult = await requireAdminSession();
  if (authResult instanceof NextResponse) return authResult;

  await dbConnect();
  try {
    const { id } = params;

    // Check for child folders
    const childFolders = await DriveFolder.countDocuments({ parentId: id });
    if (childFolders > 0) {
        return NextResponse.json({ error: 'Folder contains subfolders and cannot be deleted.' }, { status: 400 });
    }

    // Check for child files
    const childFiles = await DriveFile.countDocuments({ folderId: id });
    if (childFiles > 0) {
        return NextResponse.json({ error: 'Folder contains files and cannot be deleted.' }, { status: 400 });
    }

    await DriveFolder.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
