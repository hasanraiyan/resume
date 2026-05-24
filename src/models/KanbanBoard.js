import mongoose from 'mongoose';

const KanbanBoardSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    color: {
      type: String,
      default: '#1f644e',
    },
    position: {
      type: Number,
      default: 0,
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

KanbanBoardSchema.index({ deletedAt: 1, position: 1 });

export default mongoose.models.KanbanBoard || mongoose.model('KanbanBoard', KanbanBoardSchema);
