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
    promptHash: {
      type: String,
      index: true,
    },
    titleHash: {
      type: String,
      index: true,
    },
    usage: {
      promptTokens: { type: Number, default: 0 },
      completionTokens: { type: Number, default: 0 },
      totalTokens: { type: Number, default: 0 },
      estimatedCostUSD: { type: Number, default: 0 },
    },
    metadata: {
      durationMs: { type: Number, default: 0 },
      agentId: { type: String, default: 'coursify_search' },
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

export default mongoose.models.CoursifyResearch ||
  mongoose.model('CoursifyResearch', CoursifyResearchSchema);
