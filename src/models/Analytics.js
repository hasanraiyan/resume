/**
 * @fileoverview MongoDB model for analytics events.
 * Tracks user interactions, page views, and custom events with session management.
 * Includes automatic data expiration and aggregation methods for reporting.
 *
 * This model provides comprehensive analytics tracking with:
 * - Multiple event types (pageview, custom, click, form_submit, download, chatbot_interaction)
 * - Session-based grouping for user journey analysis
 * - Privacy-compliant data storage (hashed IPs, no PII)
 * - Device and browser detection from user agents
 * - Automatic data expiration after 1 year for compliance
 * - Optimized indexes for fast querying and aggregation
 * - Built-in aggregation methods for reporting and insights
 *
 * @example
 * ```js
 * import Analytics from '@/models/Analytics';
 * import dbConnect from '@/lib/dbConnect';
 *
 * // Track a page view event
 * const pageView = new Analytics({
 *   eventType: 'pageview',
 *   path: '/projects',
 *   sessionId: 'user-session-123',
 *   userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
 *   referrer: 'https://google.com',
 *   ipHash: 'a1b2c3d4e5f6',
 *   deviceInfo: {
 *     browser: 'Chrome',
 *     os: 'Windows',
 *     device: 'Desktop',
 *     screen: { width: 1920, height: 1080 }
 *   }
 * });
 *
 * await pageView.save();
 *
 * // Track a custom event
 * const customEvent = new Analytics({
 *   eventType: 'custom',
 *   path: '/projects',
 *   eventName: 'project_filter_used',
 *   sessionId: 'user-session-123',
 *   properties: {
 *     filterType: 'category',
 *     filterValue: 'web-development',
 *     resultsCount: 15
 *   }
 * });
 *
 * await customEvent.save();
 *
 * // Get pageview statistics for date range
 * const startDate = new Date('2024-01-01');
 * const endDate = new Date('2024-01-31');
 * const pageStats = await Analytics.getPageviewStats(startDate, endDate);
 *
 * // Get session statistics
 * const sessionStats = await Analytics.getSessionStats(startDate, endDate);
 *
 * // Query events by type and date range
 * const chatbotEvents = await Analytics.find({
 *   eventType: 'chatbot_interaction',
 *   timestamp: { $gte: startDate, $lte: endDate }
 * }).sort({ timestamp: -1 });
 * ```
 */

import mongoose from 'mongoose';

/**
 * Mongoose schema for Analytics model.
 * Stores various types of user events with metadata for analysis and reporting.
 * Data automatically expires after 1 year to maintain compliance and storage efficiency.
 *
 * @typedef {Object} Analytics
 * @property {'pageview'|'custom'|'click'|'form_submit'|'download'|'chatbot_interaction'} eventType - Type of event being tracked
 * @property {string} path - Page path or event identifier for grouping
 * @property {string} [eventName] - Custom event name for categorization
 * @property {Object} [properties={}] - Additional event metadata and custom properties
 * @property {string} sessionId - Session identifier for grouping related events
 * @property {string} [userAgent] - User agent string for device detection (not PII)
 * @property {string} [referrer] - Referring URL for traffic source analysis
 * @property {Date} [timestamp] - Event timestamp (defaults to current time)
 * @property {string} [ipHash] - Hashed IP address for geographical analysis (privacy-compliant)
 * @property {AnalyticsDeviceInfo} [deviceInfo] - Parsed device/browser information
 * @property {Date} createdAt - Auto-generated creation timestamp
 * @property {Date} updatedAt - Auto-generated update timestamp
 */

/**
 * @typedef {Object} AnalyticsDeviceInfo
 * @property {string} [browser] - Browser name (Chrome, Firefox, Safari, etc.)
 * @property {string} [os] - Operating system (Windows, macOS, Linux, etc.)
 * @property {string} [device] - Device type (Desktop, Mobile, Tablet)
 * @property {Object} [screen] - Screen dimensions
 * @property {number} [screen.width] - Screen width in pixels
 * @property {number} [screen.height] - Screen height in pixels
 */

/**
 * Enumeration of supported event types for analytics tracking.
 * Provides consistent categorization for different user interactions.
 *
 * @enum {string}
 * @readonly
 * @property {'pageview'} PAGEVIEW - Standard page view tracking
 * @property {'custom'} CUSTOM - Custom user-defined events
 * @property {'click'} CLICK - Button/link click tracking
 * @property {'form_submit'} FORM_SUBMIT - Form submission events
 * @property {'download'} DOWNLOAD - File download events
 * @property {'chatbot_interaction'} CHATBOT_INTERACTION - AI chatbot usage events
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
 * Returns comprehensive pageview metrics including total views and unique visitors
 * for each path, sorted by view count in descending order.
 *
 * This method is optimized for generating reports and dashboards showing
 * which pages are most popular and how many unique visitors they attract.
 *
 * @static
 * @async
 * @function getPageviewStats
 * @param {Date} startDate - Start of the date range for analysis
 * @param {Date} endDate - End of the date range for analysis
 * @returns {Promise<Array<{path: string, views: number, uniqueVisitors: number}>>} Array of pageview statistics sorted by views
 *
 * @example
 * ```js
 * // Get pageview stats for the last 30 days
 * const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
 * const today = new Date();
 *
 * const pageStats = await Analytics.getPageviewStats(thirtyDaysAgo, today);
 *
 * console.log(pageStats);
 * // Output:
 * // [
 * //   { path: '/projects', views: 1250, uniqueVisitors: 450 },
 * //   { path: '/', views: 890, uniqueVisitors: 320 },
 * //   { path: '/about', views: 340, uniqueVisitors: 180 },
 * //   ...
 * // ]
 *
 * // Use in analytics dashboard
 * export async function getPopularPages() {
 *   const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
 *   return await Analytics.getPageviewStats(lastWeek, new Date());
 * }
 * ```
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
 * Returns comprehensive session metrics including duration, event count,
 * pages visited, and first/last seen timestamps for each session.
 *
 * This method provides insights into user behavior and engagement patterns,
 * helping understand how visitors interact with the site over time.
 *
 * @static
 * @async
 * @function getSessionStats
 * @param {Date} startDate - Start of the date range for analysis
 * @param {Date} endDate - End of the date range for analysis
 * @returns {Promise<Array<{sessionId: string, events: number, duration: number, pages: number, firstSeen: Date, lastSeen: Date}>>} Array of session statistics sorted by last activity
 *
 * @example
 * ```js
 * // Get session stats for the last 7 days
 * const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
 * const today = new Date();
 *
 * const sessionStats = await Analytics.getSessionStats(lastWeek, today);
 *
 * console.log(sessionStats[0]);
 * // Output:
 * // {
 * //   sessionId: 'sess_abc123',
 * //   events: 15,
 * //   duration: 245.6, // seconds
 * //   pages: 8,
 * //   firstSeen: 2024-01-15T10:30:00Z,
 * //   lastSeen: 2024-01-15T14:35:00Z
 * // }
 *
 * // Find average session duration
 * const totalSessions = sessionStats.length;
 * const totalDuration = sessionStats.reduce((sum, s) => sum + s.duration, 0);
 * const avgDuration = totalDuration / totalSessions;
 *
 * // Find most active sessions
 * const activeSessions = sessionStats
 *   .filter(s => s.events > 10)
 *   .sort((a, b) => b.events - a.events);
 * ```
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
