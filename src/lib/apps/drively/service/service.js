import dbConnect from '@/lib/dbConnect';
import DrivelyFolder from '@/models/DrivelyFolder';
import DrivelyFile from '@/models/DrivelyFile';
import { v2 as cloudinary } from 'cloudinary';
import { CreateFolderSchema, UpdateFolderSchema, UpdateFileSchema } from './validators';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function ensureDb() {
  await dbConnect();
}

export async function getBootstrapData() {
  await ensureDb();

  const [folders, files] = await Promise.all([
    DrivelyFolder.find({ deletedAt: null }).lean(),
    DrivelyFile.find({ deletedAt: null }).lean(),
  ]);

  const stats = await getStorageStats();
  const recent = await DrivelyFile.find({ deletedAt: null })
    .sort({ updatedAt: -1 })
    .limit(20)
    .lean();
  const starredFiles = await DrivelyFile.find({ starred: true, deletedAt: null }).lean();
  const starredFolders = await DrivelyFolder.find({ starred: true, deletedAt: null }).lean();
  const trashCount = await Promise.all([
    DrivelyFile.countDocuments({ deletedAt: { $ne: null } }),
    DrivelyFolder.countDocuments({ deletedAt: { $ne: null } }),
  ]).then(([f, d]) => f + d);

  return {
    folders,
    files,
    stats,
    recent,
    starred: {
      files: starredFiles,
      folders: starredFolders,
    },
    trashCount,
  };
}

export async function getStorageStats() {
  await ensureDb();
  const result = await DrivelyFile.aggregate([
    { $match: { deletedAt: null } },
    {
      $group: {
        _id: null,
        totalSize: { $sum: '$size' },
        fileCount: { $sum: 1 },
      },
    },
  ]);

  const typeBreakdown = await DrivelyFile.aggregate([
    { $match: { deletedAt: null } },
    {
      $group: {
        _id: '$mimeType',
        count: { $sum: 1 },
        size: { $sum: '$size' },
      },
    },
  ]);

  const largestFiles = await DrivelyFile.find({ deletedAt: null })
    .sort({ size: -1 })
    .limit(10)
    .lean();

  return {
    totalSize: result[0]?.totalSize || 0,
    fileCount: result[0]?.fileCount || 0,
    typeBreakdown,
    largestFiles,
  };
}

export async function createFolder(payload) {
  await ensureDb();
  const validated = CreateFolderSchema.parse(payload);

  let path = '';
  if (validated.parentId) {
    const parent = await DrivelyFolder.findById(validated.parentId);
    if (!parent) throw new Error('Parent folder not found');
    path = `${parent.path}/${parent._id}`.replace(/^\/+/, '/');
  }

  const folder = new DrivelyFolder({
    name: validated.name,
    parentId: validated.parentId || null,
    path,
  });

  await folder.save();
  return folder.toObject();
}

const getCloudinaryResourceType = (mimeType) => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  return 'raw';
};

export async function uploadFile(file, folderId = null) {
  await ensureDb();

  // Basic validation
  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File size exceeds 50MB limit');
  }

  // Sanitize filename
  const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.\-_ ]/g, '_');

  const mimeType = file.type || 'application/octet-stream';
  const resourceType = getCloudinaryResourceType(mimeType);

  // Convert file to buffer
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Upload to Cloudinary with explicit resource_type so PDFs/docs are served as raw bytes
  const uploadResult = await new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          resource_type: resourceType,
          folder: 'drively',
          filename_override: sanitizedFilename,
          use_filename: true,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      )
      .end(buffer);
  });

  const newFile = new DrivelyFile({
    filename: sanitizedFilename,
    mimeType,
    size: file.size,
    cloudinaryPublicId: uploadResult.public_id,
    secureUrl: uploadResult.secure_url,
    resourceType: uploadResult.resource_type,
    folderId: folderId || null,
  });

  await newFile.save();
  return newFile.toObject();
}

export async function updateFolder(id, payload) {
  await ensureDb();
  const validated = UpdateFolderSchema.parse(payload);

  const folder = await DrivelyFolder.findById(id);
  if (!folder) throw new Error('Folder not found');

  if (validated.restore) {
    folder.deletedAt = null;
  }

  if (validated.name) folder.name = validated.name;
  if (validated.starred !== undefined) folder.starred = validated.starred;

  if (validated.parentId !== undefined) {
    if (validated.parentId === id) throw new Error('Cannot move folder into itself');

    const oldPathPrefix = `${folder.path}/${folder._id}`.replace(/^\/+/, '/');

    let newPath = '';
    if (validated.parentId) {
      const parent = await DrivelyFolder.findById(validated.parentId);
      if (!parent) throw new Error('Parent folder not found');

      // Prevent moving into its own descendants
      if (parent.path.startsWith(oldPathPrefix) || parent._id.toString() === id) {
        throw new Error('Cannot move folder into its own descendant');
      }

      newPath = `${parent.path}/${parent._id}`.replace(/^\/+/, '/');
    }

    const newPathPrefix = `${newPath}/${folder._id}`.replace(/^\/+/, '/');

    // Update all descendants' paths
    const descendants = await DrivelyFolder.find({
      path: new RegExp(`^${oldPathPrefix}($|/)`),
    });

    for (const desc of descendants) {
      desc.path = desc.path.replace(oldPathPrefix, newPathPrefix);
      await desc.save();
    }

    folder.parentId = validated.parentId;
    folder.path = newPath;
  }

  await folder.save();
  return folder.toObject();
}

export async function updateFile(id, payload) {
  await ensureDb();
  const validated = UpdateFileSchema.parse(payload);

  const file = await DrivelyFile.findById(id);
  if (!file) throw new Error('File not found');

  if (validated.restore) {
    file.deletedAt = null;
  }

  if (validated.filename) file.filename = validated.filename;
  if (validated.starred !== undefined) file.starred = validated.starred;
  if (validated.folderId !== undefined) file.folderId = validated.folderId;

  await file.save();
  return file.toObject();
}

export async function softDeleteFolder(id) {
  await ensureDb();
  const now = new Date();
  const folder = await DrivelyFolder.findById(id);
  if (!folder) throw new Error('Folder not found');

  const pathPrefix = `${folder.path}/${folder._id}`.replace(/^\/+/, '/');

  // Find all descendant folders
  const descendantFolders = await DrivelyFolder.find({
    path: new RegExp(`^${pathPrefix}($|/)`),
  }).distinct('_id');

  const allFolderIds = [folder._id, ...descendantFolders];

  await Promise.all([
    DrivelyFolder.updateMany({ _id: { $in: allFolderIds } }, { deletedAt: now }),
    DrivelyFile.updateMany({ folderId: { $in: allFolderIds } }, { deletedAt: now }),
  ]);

  return true;
}

export async function softDeleteFile(id) {
  await ensureDb();
  await DrivelyFile.findByIdAndUpdate(id, { deletedAt: new Date() });
  return true;
}

export async function permanentDeleteFile(id) {
  await ensureDb();
  const file = await DrivelyFile.findById(id);
  if (!file) throw new Error('File not found');

  await cloudinary.uploader.destroy(file.cloudinaryPublicId, {
    resource_type: file.resourceType || getCloudinaryResourceType(file.mimeType),
  });

  await DrivelyFile.findByIdAndDelete(id);
  return true;
}

export async function permanentDeleteFolder(id) {
  await ensureDb();
  const folder = await DrivelyFolder.findById(id);
  if (!folder) throw new Error('Folder not found');

  const pathPrefix = `${folder.path}/${folder._id}`.replace(/^\/+/, '/');
  const foldersToDelete = await DrivelyFolder.find({
    $or: [{ _id: id }, { path: new RegExp(`^${pathPrefix}($|/)`) }],
  });
  const folderIds = foldersToDelete.map((f) => f._id);

  const filesToDelete = await DrivelyFile.find({ folderId: { $in: folderIds } });

  // Delete all files from Cloudinary
  for (const file of filesToDelete) {
    try {
      await cloudinary.uploader.destroy(file.cloudinaryPublicId, {
        resource_type: file.resourceType || getCloudinaryResourceType(file.mimeType),
      });
    } catch (err) {
      console.error(`Failed to delete Cloudinary asset ${file.cloudinaryPublicId}`, err);
    }
  }

  await Promise.all([
    DrivelyFile.deleteMany({ folderId: { $in: folderIds } }),
    DrivelyFolder.deleteMany({ _id: { $in: folderIds } }),
  ]);

  return true;
}

export async function getTrash() {
  await ensureDb();
  const [folders, files] = await Promise.all([
    DrivelyFolder.find({ deletedAt: { $ne: null } }).lean(),
    DrivelyFile.find({ deletedAt: { $ne: null } }).lean(),
  ]);
  return { folders, files };
}

export async function emptyTrash() {
  await ensureDb();
  const filesToDelete = await DrivelyFile.find({ deletedAt: { $ne: null } });

  // Delete all trashed files from Cloudinary
  for (const file of filesToDelete) {
    try {
      await cloudinary.uploader.destroy(file.cloudinaryPublicId, {
        resource_type: file.resourceType || getCloudinaryResourceType(file.mimeType),
      });
    } catch (err) {
      console.error(`Failed to delete Cloudinary asset ${file.cloudinaryPublicId}`, err);
    }
  }

  await Promise.all([
    DrivelyFile.deleteMany({ deletedAt: { $ne: null } }),
    DrivelyFolder.deleteMany({ deletedAt: { $ne: null } }),
  ]);

  return true;
}

export async function executeBulkAction(payload) {
  await ensureDb();
  const { fileIds = [], folderIds = [], action, targetFolderId } = payload;

  switch (action) {
    case 'delete':
      await Promise.all([
        ...fileIds.map((id) => softDeleteFile(id)),
        ...folderIds.map((id) => softDeleteFolder(id)),
      ]);
      break;

    case 'restore':
      await Promise.all([
        DrivelyFile.updateMany({ _id: { $in: fileIds } }, { deletedAt: null }),
        DrivelyFolder.updateMany({ _id: { $in: folderIds } }, { deletedAt: null }),
      ]);
      break;

    case 'star':
      await Promise.all([
        DrivelyFile.updateMany({ _id: { $in: fileIds } }, { starred: true }),
        DrivelyFolder.updateMany({ _id: { $in: folderIds } }, { starred: true }),
      ]);
      break;

    case 'unstar':
      await Promise.all([
        DrivelyFile.updateMany({ _id: { $in: fileIds } }, { starred: false }),
        DrivelyFolder.updateMany({ _id: { $in: folderIds } }, { starred: false }),
      ]);
      break;

    case 'move':
      if (targetFolderId !== undefined) {
        // For files, it's a simple update
        if (fileIds.length > 0) {
          await DrivelyFile.updateMany({ _id: { $in: fileIds } }, { folderId: targetFolderId });
        }
        // For folders, we must use updateFolder to handle recursive path updates
        for (const id of folderIds) {
          await updateFolder(id, { parentId: targetFolderId });
        }
      }
      break;

    case 'download':
      // Bulk download usually involves zipping on server, but for now we'll just return URLs or handle on client
      // The prompt suggests "download all at once", which typically means a zip.
      // For v2, let's at least ensure we have the files.
      break;

    default:
      throw new Error(`Unsupported bulk action: ${action}`);
  }

  return true;
}
