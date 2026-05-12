import mongoose from 'mongoose';

/**
 * CoursifySection Model
 *
 * Architecture: Markdown-First
 * - 'content' is the raw Markdown source of truth.
 * - 'blocks' is a processed array of objects (MdBlock, QuizBlock, etc.)
 *   used by the frontend for specialized rendering.
 *
 * Database operations (db-ops.js) ensure these two fields are kept in sync.
 */
const CoursifySectionSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CoursifyCourse',
      required: true,
      index: true,
    },
    moduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CoursifyModule',
      default: null,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    // Raw Markdown Source of Truth
    content: {
      type: String,
      default: '',
    },
    // Processed blocks for specialized rendering (Quiz, Steps, etc.)
    // Stored as Mixed to avoid redundant schema maintenance.
    blocks: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    summary: {
      type: String,
      default: '',
    },
    learningGoals: {
      type: [String],
      default: [],
    },
    estimatedDuration: {
      type: String,
      default: '',
    },
    order: {
      type: Number,
      default: 0,
      index: true,
    },
    status: {
      type: String,
      enum: ['planned', 'draft', 'needs_review', 'complete'],
      default: 'draft',
    },
    // External resources/links associated with this section
    resources: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
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
  {
    timestamps: true,
    minimize: false,
    strict: false, // Allows flexible block structures
  }
);

// Force model re-creation to pick up schema changes in dev
if (process.env.NODE_ENV === 'development') {
  delete mongoose.models.CoursifySection;
}

export default mongoose.models.CoursifySection ||
  mongoose.model('CoursifySection', CoursifySectionSchema);
