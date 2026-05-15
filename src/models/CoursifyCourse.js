import mongoose from 'mongoose';

const ResearchNoteSchema = new mongoose.Schema(
  {
    title: { type: String, default: '' },
    summary: { type: String, default: '' },
    sourceUrl: { type: String, default: '' },
    sourceType: {
      type: String,
      enum: ['web', 'paper', 'book', 'video', 'other'],
      default: 'other',
    },
    notes: { type: String, default: '' },
    accessedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

const CoursifyCourseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    thumbnail: {
      type: String,
      default: null,
    },
    thumbnailGenerating: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'draft',
    },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
    },
    estimatedDuration: {
      type: String,
      default: '',
    },
    tags: {
      type: [String],
      default: [],
    },
    // ── Planning workspace ──────────────────────────────────────
    targetAudience: { type: String, default: '' },
    learningObjectives: { type: [String], default: [] },
    prerequisites: { type: [String], default: [] },
    outcome: { type: String, default: '' },
    outline: { type: String, default: '' },
    planningNotes: { type: String, default: '' },
    agentNotes: { type: String, default: '' },
    researchNotes: { type: [ResearchNoteSchema], default: [] },
    authoringStatus: {
      type: String,
      enum: ['idea', 'researching', 'planned', 'drafting', 'reviewing', 'ready', 'published'],
      default: 'idea',
    },
    usageStats: {
      promptTokens: { type: Number, default: 0 },
      completionTokens: { type: Number, default: 0 },
      totalTokens: { type: Number, default: 0 },
      estimatedCostINR: { type: Number, default: 0 },
      toolCalls: { type: Number, default: 0 },
    },
    // ────────────────────────────────────────────────────────────
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

export default mongoose.models.CoursifyCourse ||
  mongoose.model('CoursifyCourse', CoursifyCourseSchema);
