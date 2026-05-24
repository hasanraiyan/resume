import mongoose from 'mongoose';

const KanbanColumnSchema = new mongoose.Schema(
  {
    boardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'KanbanBoard',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    color: {
      type: String,
      default: '#e5e3d8',
    },
    position: {
      type: Number,
      default: 0,
    },
    wipLimit: {
      type: Number,
      default: null,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    syncVersion: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

KanbanColumnSchema.index({ boardId: 1, position: 1 });
KanbanColumnSchema.index({ boardId: 1, deletedAt: 1 });

export default mongoose.models.KanbanColumn || mongoose.model('KanbanColumn', KanbanColumnSchema);
