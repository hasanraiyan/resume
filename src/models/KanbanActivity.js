import mongoose from 'mongoose';

const KanbanActivitySchema = new mongoose.Schema(
  {
    boardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'KanbanBoard',
      required: true,
      index: true,
    },
    cardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'KanbanCard',
      default: null,
    },
    action: {
      type: String,
      required: true,
      enum: [
        'card_created',
        'card_moved',
        'card_updated',
        'card_deleted',
        'column_created',
        'column_deleted',
        'board_created',
        'board_duplicated',
      ],
    },
    details: {
      type: String,
      default: '',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

KanbanActivitySchema.index({ boardId: 1, createdAt: -1 });

export default mongoose.models.KanbanActivity ||
  mongoose.model('KanbanActivity', KanbanActivitySchema);
