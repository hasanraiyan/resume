import mongoose from 'mongoose';

const DriveFolderSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DriveFolder',
      default: null, // null means root folder
    },
    credentialId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StorageCredential',
      required: true, // Ties this virtual folder to a specific storage drive
    },
  },
  { timestamps: true }
);

// Compound index for uniqueness of folder names within a parent in a specific drive
DriveFolderSchema.index({ name: 1, parentId: 1, credentialId: 1 }, { unique: true });

export default mongoose.models.DriveFolder || mongoose.model('DriveFolder', DriveFolderSchema);
