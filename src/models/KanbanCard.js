import mongoose from 'mongoose';

const ChecklistItemSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    done: { type: Boolean, default: false },
  },
  { _id: true }
);

const KanbanCardSchema = new mongoose.Schema(
  {
    boardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'KanbanBoard',
      required: true,
      index: true,
    },
    columnId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'KanbanColumn',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    position: {
      type: Number,
      default: 0,
    },
    labels: [
      {
        type: String,
      },
    ],
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    dueDate: {
      type: Date,
      default: null,
    },
    checklist: [ChecklistItemSchema],
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

KanbanCardSchema.index({ boardId: 1, columnId: 1, position: 1 });
KanbanCardSchema.index({ boardId: 1, deletedAt: 1 });

export default mongoose.models.KanbanCard || mongoose.model('KanbanCard', KanbanCardSchema);
