/**
 * @fileoverview MongoDB model for tracking user engagement interactions.
 * Provides server-side tracking for likes and claps to prevent spam
 * and maintain engagement analytics.
 */

import mongoose from 'mongoose';

/**
 * Mongoose schema for Engagement model.
 * Tracks individual user interactions with articles and projects
 * to prevent spam and provide engagement analytics.
 *
 * @typedef {Object} Engagement
 * @property {string} contentType - Type of content ('article' or 'project')
 * @property {string} contentSlug - Slug identifier of the content
 * @property {string} engagementType - Type of engagement ('like' or 'clap')
 * @property {string} clientIP - IP address of the user (hashed for privacy)
 * @property {string} userAgent - User agent string (first 100 chars for fingerprinting)
 * @property {Date} createdAt - When the engagement occurred
 * @property {Date} expiresAt - When this tracking record expires (24 hours)
 */
const EngagementSchema = new mongoose.Schema(
  {
    contentType: {
      type: String,
      required: true,
      enum: ['article', 'project'],
      index: true,
    },
    contentSlug: {
      type: String,
      required: true,
      index: true,
    },
    engagementType: {
      type: String,
      required: true,
      enum: ['like', 'clap'],
      index: true,
    },
    clientIP: {
      type: String,
      required: true,
      index: true,
    },
    userAgent: {
      type: String,
      maxlength: 100,
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
    },
  },
  {
    timestamps: true,
  }
);

// Create compound index for efficient lookups
EngagementSchema.index({
  contentType: 1,
  contentSlug: 1,
  engagementType: 1,
  clientIP: 1,
});

// TTL index to automatically remove expired records
EngagementSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.Engagement || mongoose.model('Engagement', EngagementSchema);
