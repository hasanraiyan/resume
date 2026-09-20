import mongoose from 'mongoose';

const ProjectTimeTaskSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProjectTimeWorkspace',
      required: true,
      index: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProjectTimeProject',
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    assigneeEmail: { type: String, default: '' },
    status: {
      type: String,
      enum: ['Todo', 'In Progress', 'Done'],
      default: 'Todo',
      index: true,
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Medium',
    },
    type: {
      type: String,
      enum: ['Task', 'Issue'],
      default: 'Task',
    },
    estimatedHours: { type: Number, default: 0, min: 0 },
    dueDate: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.models.ProjectTimeTask ||
  mongoose.model('ProjectTimeTask', ProjectTimeTaskSchema);
