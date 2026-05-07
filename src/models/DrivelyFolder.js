import mongoose from 'mongoose';

const DrivelyFolderSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DrivelyFolder',
      default: null,
      index: true,
    },
    path: {
      type: String, // e.g., "/folder-id/subfolder-id"
      default: '',
    },
    starred: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
      index: true,
    },
    syncVersion: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.DrivelyFolder || mongoose.model('DrivelyFolder', DrivelyFolderSchema);
