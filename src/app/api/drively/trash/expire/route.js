import { requireAdminAuth } from '@/lib/money-auth';
import { ensureDb, getDrivelySettings } from '@/lib/apps/drively/service/service';
import DrivelyFile from '@/models/DrivelyFile';
import DrivelyFolder from '@/models/DrivelyFolder';
import { getCloudinary } from '@/lib/cloudinary';
import { NextResponse } from 'next/server';

export async function DELETE(request) {
  const auth = await requireAdminAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    await ensureDb();

    const settings = await getDrivelySettings();
    if (!settings.autoEmptyTrash) {
      return NextResponse.json({
        success: true,
        message: 'Auto-empty trash is disabled',
      });
    }

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() - 30);

    const expiredFiles = await DrivelyFile.find({
      deletedAt: { $ne: null, $lt: expiryDate },
    });

    const expiredFolders = await DrivelyFolder.find({
      deletedAt: { $ne: null, $lt: expiryDate },
    });

    // Delete files from Cloudinary
    const cloudinary = await getCloudinary();
    for (const file of expiredFiles) {
      try {
        await cloudinary.uploader.destroy(file.cloudinaryPublicId, {
          resource_type: file.resourceType || 'raw',
        });
      } catch (err) {
        console.error(`Failed to delete expired Cloudinary asset ${file.cloudinaryPublicId}`, err);
      }
    }

    const folderIds = expiredFolders.map((f) => f._id);
    const fileIds = expiredFiles.map((f) => f._id);

    await Promise.all([
      DrivelyFile.deleteMany({ _id: { $in: fileIds } }),
      DrivelyFolder.deleteMany({ _id: { $in: folderIds } }),
    ]);

    return NextResponse.json({
      success: true,
      deletedFiles: fileIds.length,
      deletedFolders: folderIds.length,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
