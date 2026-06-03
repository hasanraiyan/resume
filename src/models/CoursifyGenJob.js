import mongoose from 'mongoose';

/**
 * CoursifyGenJob Model
 *
 * A persistent work queue for AI section-content generation.
 *
 * Why this exists: Pollinations gives roughly $0.40 of generation budget per
 * hour, which resets hourly. Generating a section interactively (and waiting
 * for it) means babysitting ~4 sections per hour. Instead, the studio enqueues
 * sections as jobs and a cron worker (/api/cron/coursify-generate) drains the
 * queue automatically, pacing itself against the live balance.
 *
 * Lifecycle: queued → generating → done
 *                              ↘ failed (after maxAttempts)
 *                              ↘ back to queued (transient error / budget hit)
 */
const CoursifyGenJobSchema = new mongoose.Schema(
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
    sectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CoursifySection',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['queued', 'generating', 'done', 'failed', 'canceled'],
      default: 'queued',
      index: true,
    },
    // Which generation tier to use. Mirrors the EditSectionModal generationMode.
    agent: {
      type: String,
      enum: ['flash', 'pro'],
      default: 'flash',
    },
    isReferenceEnabled: {
      type: Boolean,
      default: false,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    maxAttempts: {
      type: Number,
      default: 3,
    },
    // Last failure message (kept for the UI / debugging).
    error: {
      type: String,
      default: '',
    },
    // Token usage + estimated cost of the successful run.
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

// Pull the oldest pending job efficiently.
CoursifyGenJobSchema.index({ status: 1, createdAt: 1 });

// Force model re-creation to pick up schema changes in dev
if (process.env.NODE_ENV === 'development') {
  delete mongoose.models.CoursifyGenJob;
}

export default mongoose.models.CoursifyGenJob ||
  mongoose.model('CoursifyGenJob', CoursifyGenJobSchema);
