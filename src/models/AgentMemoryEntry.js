import mongoose from 'mongoose';

const AgentMemoryEntrySchema = new mongoose.Schema(
  {
    namespaceKey: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    platform: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    integrationId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    chatId: {
      type: String,
      required: true,
      trim: true,
    },
    chatType: {
      type: String,
      default: 'private',
      trim: true,
    },
    username: {
      type: String,
      default: '',
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    normalizedContent: {
      type: String,
      required: true,
      trim: true,
    },
    keywords: {
      type: [String],
      default: [],
    },
    salience: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
      index: true,
    },
    mentionCount: {
      type: Number,
      default: 1,
      min: 1,
    },
    firstObservedAt: {
      type: Date,
      required: true,
    },
    lastObservedAt: {
      type: Date,
      required: true,
      index: true,
    },
    lastRecalledAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'agent_memory_entries',
  }
);

AgentMemoryEntrySchema.index(
  { namespaceKey: 1, category: 1, normalizedContent: 1 },
  { unique: true, name: 'namespace_category_normalizedContent_unique' }
);
AgentMemoryEntrySchema.index({
  content: 'text',
  keywords: 'text',
});

export default mongoose.models.AgentMemoryEntry ||
  mongoose.model('AgentMemoryEntry', AgentMemoryEntrySchema);
