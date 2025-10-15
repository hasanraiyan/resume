/**
 * @fileoverview Mongoose model for storing chat interaction logs.
 * This model captures the details of each conversation between a user and the AI chatbot
 * for quality assurance, analysis, and potential fine-tuning purposes.
 *
 * This model provides comprehensive logging for AI chatbot interactions with:
 * - Complete conversation history tracking (user messages and AI responses)
 * - Tool usage logging for function calling analysis
 * - Performance metrics (execution time tracking)
 * - Session-based grouping for conversation flow analysis
 * - Page context tracking for understanding user journey
 * - Model usage statistics for optimization insights
 * - Database indexing for efficient querying and analytics
 *
 * @example
 * ```js
 * import ChatLog from '@/models/ChatLog';
 * import dbConnect from '@/lib/dbConnect';
 *
 * // Log a new chat interaction
 * const chatLog = new ChatLog({
 *   sessionId: 'user-session-123',
 *   path: '/projects',
 *   userMessage: 'Tell me about your React projects',
 *   aiResponse: 'I have several React projects including an e-commerce platform...',
 *   modelName: 'gpt-4-turbo-preview',
 *   toolsUsed: [
 *     {
 *       name: 'listAllProjects',
 *       arguments: {},
 *       iteration: 1
 *     },
 *     {
 *       name: 'getProjectDetails',
 *       arguments: { slug: 'ecommerce-platform' },
 *       iteration: 2
 *     }
 *   ],
 *   executionTime: 1250 // milliseconds
 * });
 *
 * await chatLog.save();
 *
 * // Query chat logs for analysis
 * const recentChats = await ChatLog.find({})
 *   .sort({ createdAt: -1 })
 *   .limit(100);
 *
 * // Get tool usage statistics
 * const toolStats = await ChatLog.aggregate([
 *   { $unwind: '$toolsUsed' },
 *   { $group: { _id: '$toolsUsed.name', count: { $sum: 1 } } }
 * ]);
 *
 * // Find slow responses for optimization
 * const slowResponses = await ChatLog.find({
 *   executionTime: { $gt: 3000 }
 * }).sort({ executionTime: -1 });
 *
 * // Get conversation by session
 * const conversation = await ChatLog.find({ sessionId: 'user-session-123' })
 *   .sort({ createdAt: 1 });
 * ```
 */

import mongoose from 'mongoose';

/**
 * Embedded schema for tracking tool usage within chat interactions.
 * Records which tools were called, their arguments, and in which iteration
 * they were used during the conversation flow.
 *
 * @typedef {Object} ToolUsage
 * @property {string} name - Name of the tool that was executed
 * @property {Object} arguments - Arguments passed to the tool function
 * @property {number} iteration - Which iteration of the conversation this tool was used in
 */

/**
 * Main schema for ChatLog model.
 * Stores comprehensive chat interaction data for analysis, debugging,
 * and performance monitoring of the AI chatbot system.
 *
 * @typedef {Object} ChatLog
 * @property {string} sessionId - Unique session identifier for grouping related messages
 * @property {string} path - Page path where the chat occurred (e.g., '/projects', '/blog')
 * @property {string} userMessage - The user's input message/question
 * @property {string} aiResponse - The AI assistant's complete response
 * @property {string} modelName - AI model used for generating the response
 * @property {ToolUsage[]} [toolsUsed=[]] - Array of tools called during this interaction
 * @property {number} [executionTime] - Total execution time in milliseconds
 * @property {Date} createdAt - Auto-generated timestamp of when the chat occurred
 * @property {Date} updatedAt - Auto-generated timestamp of last update
 */
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
