/**
 * @fileoverview Mongoose model for storing chat interaction logs.
 * This model captures the details of each conversation between a user and the AI chatbot
 * for quality assurance, analysis, and potential fine-tuning purposes.
 */

import mongoose from 'mongoose';

const toolUsageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    arguments: {
      type: Object,
      required: true,
    },
    iteration: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const ChatLogSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      trim: true,
      index: true, // Index for faster querying by session
    },
    path: {
      type: String,
      required: true,
      trim: true,
    },
    userMessage: {
      type: String,
      required: true,
      trim: true,
    },
    aiResponse: {
      type: String,
      required: true,
      trim: true,
    },
    modelName: {
      type: String,
      required: true,
      trim: true,
    },
    toolsUsed: {
      type: [toolUsageSchema],
      default: [],
    },
    executionTime: {
      type: Number, // Time in milliseconds
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt timestamps
    collection: 'chat_logs', // Explicitly set collection name
  }
);

// To prevent model recompilation on hot reloads
export default mongoose.models.ChatLog || mongoose.model('ChatLog', ChatLogSchema);