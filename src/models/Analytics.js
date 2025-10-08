/**
 * @fileoverview MongoDB model for analytics events.
 * Tracks user interactions, page views, and custom events with session management.
 * Includes automatic data expiration and aggregation methods for reporting.
 */

// src/lib/models/Analytics.js
import mongoose from 'mongoose';

/**
 * Mongoose schema for Analytics model.
 * Stores various types of user events with metadata for analysis.
 * Data automatically expires after 1 year.
 *
 * @typedef {Object} Analytics
 * @property {string} eventType - Type of event (pageview, custom, click, form_submit, download, chatbot_interaction)
 * @property {string} path - Page path or event identifier
 * @property {string} eventName - Name for custom events
 * @property {Object} properties - Additional event metadata
 * @property {string} sessionId - Session identifier for grouping
 * @property {string} userAgent - User agent string
 * @property {string} referrer - Referrer URL
 * @property {Date} timestamp - Event timestamp
 * @property {string} ipHash - Hashed IP address for privacy
 * @property {Object} deviceInfo - Device/browser information
 * @property {Date} createdAt - Auto-generated creation timestamp
 * @property {Date} updatedAt - Auto-generated update timestamp
 */
const AnalyticsSchema = new mongoose.Schema(
  {
    // Event type: 'pageview', 'custom', etc.
    eventType: {
      type: String,
      required: true,
      enum: ['pageview', 'custom', 'click', 'form_submit', 'download', 'chatbot_interaction'],
      index: true,
    },

    // Page path or event identifier
    path: {
      type: String,
      required: true,
      index: true,
    },

    // Event name for custom events
    eventName: {
      type: String,
      index: true,
    },

    // Event properties/metadata
    properties: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // Session identifier for grouping events
    sessionId: {
      type: String,
      required: true,
      index: true,
    },

    // User agent string (for bot filtering, not PII)
    userAgent: {
      type: String,
      index: true,
    },

    // Referrer URL
    referrer: {
      type: String,
      index: true,
    },

    // Timestamp of the event
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },

    // IP address hash (for geographical analysis, not full IP)
    ipHash: {
      type: String,
      index: true,
    },

    // Device/browser information derived from user agent
    deviceInfo: {
      browser: String,
      os: String,
      device: String,
      screen: {
        width: Number,
        height: Number,
      },
    },
  },
  {
    timestamps: true,
    // Automatically expire old analytics data after 1 year
    expireAfterSeconds: 365 * 24 * 60 * 60,
  }
);

// Compound indexes for efficient queries
AnalyticsSchema.index({ timestamp: -1, eventType: 1 });
AnalyticsSchema.index({ sessionId: 1, timestamp: -1 });
AnalyticsSchema.index({ path: 1, timestamp: -1 });

/**
 * Aggregates pageview statistics by path for a given date range.
 * Returns views and unique visitors per path.
 *
 * @static
 * @function getPageviewStats
 * @param {Date} startDate - Start of date range
 * @param {Date} endDate - End of date range
 * @returns {Promise<Array<{path: string, views: number, uniqueVisitors: number}>>} Aggregated pageview statistics
 */
AnalyticsSchema.statics.getPageviewStats = async function (startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        eventType: 'pageview',
        timestamp: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: '$path',
        count: { $sum: 1 },
        uniqueSessions: { $addToSet: '$sessionId' },
      },
    },
    {
      $project: {
        path: '$_id',
        views: '$count',
        uniqueVisitors: { $size: '$uniqueSessions' },
        _id: 0,
      },
    },
    { $sort: { views: -1 } },
  ]);
};

/**
 * Aggregates session statistics for a given date range.
 * Returns session duration, event count, and pages visited per session.
 *
 * @static
 * @function getSessionStats
 * @param {Date} startDate - Start of date range
 * @param {Date} endDate - End of date range
 * @returns {Promise<Array<{sessionId: string, events: number, duration: number, pages: number, firstSeen: Date, lastSeen: Date}>>} Aggregated session statistics
 */
AnalyticsSchema.statics.getSessionStats = async function (startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        timestamp: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: '$sessionId',
        events: { $sum: 1 },
        firstSeen: { $min: '$timestamp' },
        lastSeen: { $max: '$timestamp' },
        paths: { $addToSet: '$path' },
      },
    },
    {
      $project: {
        sessionId: '$_id',
        events: 1,
        duration: {
          $divide: [
            { $subtract: ['$lastSeen', '$firstSeen'] },
            1000, // Convert to seconds
          ],
        },
        pages: { $size: '$paths' },
        firstSeen: {
          $cond: {
            if: '$firstSeen',
            then: '$firstSeen',
            else: '$$NOW',
          },
        },
        lastSeen: {
          $cond: {
            if: '$lastSeen',
            then: '$lastSeen',
            else: '$$NOW',
          },
        },
        _id: 0,
      },
    },
    {
      $sort: { lastSeen: -1 },
    },
  ]);
};

export default mongoose.models.Analytics || mongoose.model('Analytics', AnalyticsSchema);
