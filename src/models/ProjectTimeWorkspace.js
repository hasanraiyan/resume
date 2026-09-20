import mongoose from 'mongoose';

const MemberSchema = new mongoose.Schema({
  email: { type: String, required: true },
  name: { type: String, default: '' },
  role: {
    type: String,
    enum: ['Admin', 'Manager', 'Member'],
    default: 'Member',
  },
  joinedAt: { type: Date, default: Date.now },
});

const ProjectTimeWorkspaceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    ownerEmail: { type: String, required: true },
    members: [MemberSchema],
    settings: {
      alertThresholdPercent: { type: Number, default: 80 },
      allowMultipleSimultaneousTimers: { type: Boolean, default: false },
      requireTaskForTimer: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

export default mongoose.models.ProjectTimeWorkspace ||
  mongoose.model('ProjectTimeWorkspace', ProjectTimeWorkspaceSchema);
