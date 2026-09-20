import mongoose from 'mongoose';

const ProjectTimeTimeEntrySchema = new mongoose.Schema(
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
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProjectTimeTask',
      default: null,
      index: true,
    },
    userEmail: { type: String, required: true, index: true },
    userName: { type: String, default: '' },
    date: { type: String, required: true, index: true }, // YYYY-MM-DD
    startTime: { type: Date, required: true },
    endTime: { type: Date, default: null },
    duration: { type: Number, default: 0 }, // Total duration in seconds
    description: { type: String, default: '' },
    billable: { type: Boolean, default: true },
    isRunning: { type: Boolean, default: false, index: true },
    timesheetStatus: {
      type: String,
      enum: ['Draft', 'Submitted', 'Approved', 'Rejected'],
      default: 'Draft',
    },
  },
  { timestamps: true }
);

export default mongoose.models.ProjectTimeTimeEntry ||
  mongoose.model('ProjectTimeTimeEntry', ProjectTimeTimeEntrySchema);
