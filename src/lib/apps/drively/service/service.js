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
          filename_override: file.name,
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
    filename: file.name,
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
    let path = '';
    if (validated.parentId) {
      const parent = await DrivelyFolder.findById(validated.parentId);
      if (!parent) throw new Error('Parent folder not found');
      path = `${parent.path}/${parent._id}`.replace(/^\/+/, '/');
    }
    folder.parentId = validated.parentId;
    folder.path = path;
    // Note: In a full implementation, we'd need to update all children's paths too.
    // For v1, we'll keep it simple or implement recursive path update.
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

  // Soft delete the folder and all its contents recursively
  // For v1, we just mark this folder. A better way is to mark everything with this path prefix.
  const pathPrefix = `${folder.path}/${folder._id}`.replace(/^\/+/, '/');

  await Promise.all([
    DrivelyFolder.findByIdAndUpdate(id, { deletedAt: now }),
    DrivelyFolder.updateMany({ path: new RegExp(`^${pathPrefix}`) }, { deletedAt: now }),
    DrivelyFile.updateMany({ folderId: id }, { deletedAt: now }),
    // This doesn't catch files in subfolders, need to handle that if v1 requires it.
    // Let's improve:
    DrivelyFile.updateMany(
      {
        folderId: {
          $in: await DrivelyFolder.find({
            $or: [{ _id: id }, { path: new RegExp(`^${pathPrefix}`) }],
          }).distinct('_id'),
        },
      },
      { deletedAt: now }
    ),
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
    $or: [{ _id: id }, { path: new RegExp(`^${pathPrefix}`) }],
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
