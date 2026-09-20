import mongoose from 'mongoose';

const ProjectTimeProjectSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProjectTimeWorkspace',
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    estimatedHours: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ['Active', 'Archived', 'Completed'],
      default: 'Active',
      index: true,
    },
    deadline: { type: Date, default: null },
    members: [{ type: String }],
    color: { type: String, default: '#1f644e' },
  },
  { timestamps: true }
);

export default mongoose.models.ProjectTimeProject ||
  mongoose.model('ProjectTimeProject', ProjectTimeProjectSchema);
