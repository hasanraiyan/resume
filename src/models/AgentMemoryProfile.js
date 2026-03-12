import mongoose from 'mongoose';

const AgentMemoryProfileSchema = new mongoose.Schema(
  {
    namespaceKey: {
      type: String,
      required: true,
      trim: true,
      unique: true,
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
    summary: {
      type: String,
      default: '',
      trim: true,
    },
    facts: {
      type: [String],
      default: [],
    },
    preferences: {
      type: [String],
      default: [],
    },
    goals: {
      type: [String],
      default: [],
    },
    constraints: {
      type: [String],
      default: [],
    },
    topics: {
      type: [String],
      default: [],
    },
    lastRecalledAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'agent_memory_profiles',
  }
);

export default mongoose.models.AgentMemoryProfile ||
  mongoose.model('AgentMemoryProfile', AgentMemoryProfileSchema);
