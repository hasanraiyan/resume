import mongoose from 'mongoose';

const CoursifyModuleSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CoursifyCourse',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    summary: {
      type: String,
      default: '',
    },
    learningGoals: {
      type: [String],
      default: [],
    },
    order: {
      type: Number,
      default: 0,
      index: true,
    },
    status: {
      type: String,
      enum: ['planned', 'drafting', 'complete', 'needs_review'],
      default: 'planned',
    },
    deletedAt: {
      type: Date,
      default: null,
      index: true,
    },
    syncVersion: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.models.CoursifyModule ||
  mongoose.model('CoursifyModule', CoursifyModuleSchema);
