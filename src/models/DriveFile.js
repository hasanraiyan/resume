import mongoose from 'mongoose';

const DriveFileSchema = new mongoose.Schema(
  {
    fileName: {
      type: String,
      required: true,
      trim: true,
    },
    fileKey: {
      type: String,
      required: true, // The provider's key/identifier
    },
    url: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      default: 'application/octet-stream',
    },
    size: {
      type: Number,
      default: 0, // in bytes
    },
    folderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DriveFolder',
      default: null, // null means root folder of the drive
    },
    credentialId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StorageCredential',
      required: true,
    },
  },
  { timestamps: true }
);

// Compound index for uniqueness of file names within a folder in a specific drive
DriveFileSchema.index({ fileName: 1, folderId: 1, credentialId: 1 }, { unique: true });
// Index for querying by credentialId
DriveFileSchema.index({ credentialId: 1 });

export default mongoose.models.DriveFile || mongoose.model('DriveFile', DriveFileSchema);
