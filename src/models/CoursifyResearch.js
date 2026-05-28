import mongoose from 'mongoose';

const CoursifyResearchSchema = new mongoose.Schema(
  {
    topic: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    summary: {
      type: String,
      trim: true,
    },
    promptHash: {
      type: String,
      index: true,
    },
    titleHash: {
      type: String,
      index: true,
    },
    qdrantId: {
      type: String,
      index: true,
      sparse: true,
    },
    usage: {
      promptTokens: { type: Number, default: 0 },
      completionTokens: { type: Number, default: 0 },
      totalTokens: { type: Number, default: 0 },
      estimatedCostUSD: { type: Number, default: 0 },
    },
    metadata: {
      durationMs: { type: Number, default: 0 },
      agentId: { type: String, default: 'coursify_search_flash' },
      provider: { type: String, default: 'pollinations' },
      fromCache: { type: Boolean, default: false },
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    deletedAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  { timestamps: true }
);

// Compound Text Index for high-performance fuzzy search
CoursifyResearchSchema.index(
  { title: 'text', topic: 'text' },
  { weights: { title: 10, topic: 5 }, name: 'ResearchTextIndex' }
);

export default mongoose.models.CoursifyResearch ||
  mongoose.model('CoursifyResearch', CoursifyResearchSchema);
