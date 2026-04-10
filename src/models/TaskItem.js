import mongoose from 'mongoose';

const TaskItemSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true }, // Added for multi-tenancy
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TaskProject',
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: ['todo', 'in_progress', 'done'],
      default: 'todo',
      index: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
      index: true,
    },
    dueDate: { type: Date, default: null, index: true },
    completedAt: { type: Date, default: null },
    tags: {
      type: [String],
      default: [],
      set: (value) =>
        Array.isArray(value)
          ? value
              .map((tag) => String(tag).trim())
              .filter(Boolean)
              .slice(0, 10)
          : [],
    },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true }
);

TaskItemSchema.index({ userId: 1, status: 1 });
TaskItemSchema.index({ userId: 1, projectId: 1 });

export default mongoose.models.TaskItem || mongoose.model('TaskItem', TaskItemSchema);
