import mongoose from 'mongoose';

const DrivelyActivitySchema = new mongoose.Schema(
  {
    action: {
      type: String,
      enum: ['upload', 'delete', 'restore', 'rename', 'move', 'star', 'empty_trash'],
      required: true,
    },
    itemType: {
      type: String,
      enum: ['file', 'folder', 'bulk'],
      required: true,
    },
    itemName: {
      type: String,
      required: true,
    },
    targetFolder: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.DrivelyActivity ||
  mongoose.model('DrivelyActivity', DrivelyActivitySchema);
