import mongoose from 'mongoose';

/**
 * CoursifyExternalJob Model
 *
 * For external apps (pyqdeck, etc.) to queue content generation.
 * Similar to CoursifyGenJob but without course/module/section refs.
 * Results are stored in CoursifyResearch (same table as web generation).
 *
 * Flow: External app → POST /api/coursify/generate-topic/queue → Job created
 *       Cron worker processes → Result in CoursifyResearch
 *       External app fetches by slug
 */
const CoursifyExternalJobSchema = new mongoose.Schema(
  {
    topic: {
      type: String,
      required: true,
      trim: true,
    },
    isReferenceEnabled: {
      type: Boolean,
      default: false,
    },
    // External app identifier (e.g., "pyqdeck", "myapp-v1")
    clientId: {
      type: String,
      default: 'unknown',
      index: true,
    },
    status: {
      type: String,
      enum: ['queued', 'generating', 'done', 'failed', 'canceled'],
      default: 'queued',
      index: true,
    },
    agent: {
      type: String,
      enum: ['flash', 'pro'],
      default: 'flash',
    },
    attempts: {
      type: Number,
      default: 0,
    },
    maxAttempts: {
      type: Number,
      default: 3,
    },
    error: {
      type: String,
      default: '',
    },
    // Once done, store the slug from CoursifyResearch
    // so external app can fetch via GET /api/coursify/research/[slug]
    resultSlug: {
      type: String,
      default: null,
    },
    usage: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    lastRunAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
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
  }
);

// Pull the oldest pending job efficiently
CoursifyExternalJobSchema.index({ status: 1, createdAt: 1 });

// Force model re-creation to pick up schema changes in dev
if (process.env.NODE_ENV === 'development') {
  delete mongoose.models.CoursifyExternalJob;
}

export default mongoose.models.CoursifyExternalJob ||
  mongoose.model('CoursifyExternalJob', CoursifyExternalJobSchema);
