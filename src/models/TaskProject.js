import mongoose from 'mongoose';

const TaskProjectSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true }, // Added for multi-tenancy
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    color: { type: String, default: '#1f644e', trim: true },
    status: {
      type: String,
      enum: ['active', 'completed', 'archived'],
      default: 'active',
      index: true,
    },
    deadline: { type: Date, default: null },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true }
);

TaskProjectSchema.index({ createdAt: -1 });

export default mongoose.models.TaskProject || mongoose.model('TaskProject', TaskProjectSchema);
