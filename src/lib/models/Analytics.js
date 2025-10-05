// src/lib/models/Analytics.js
import mongoose from 'mongoose';

const AnalyticsSchema = new mongoose.Schema({
  // Event type: 'pageview', 'custom', etc.
  eventType: {
    type: String,
    required: true,
    enum: ['pageview', 'custom', 'click', 'form_submit', 'download'],
    index: true
  },

  // Page path or event identifier
  path: {
    type: String,
    required: true,
    index: true
  },

  // Event name for custom events
  eventName: {
    type: String,
    index: true
  },

  // Event properties/metadata
  properties: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },

  // Session identifier for grouping events
  sessionId: {
    type: String,
    required: true,
    index: true
  },

  // User agent string (for bot filtering, not PII)
  userAgent: {
    type: String,
    index: true
  },

  // Referrer URL
  referrer: {
    type: String,
    index: true
  },

  // Timestamp of the event
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },

  // IP address hash (for geographical analysis, not full IP)
  ipHash: {
    type: String,
    index: true
  },

  // Device/browser information derived from user agent
  deviceInfo: {
    browser: String,
    os: String,
    device: String,
    screen: {
      width: Number,
      height: Number
    }
  }
}, {
  timestamps: true,
  // Automatically expire old analytics data after 1 year
  expireAfterSeconds: 365 * 24 * 60 * 60
});

// Compound indexes for efficient queries
AnalyticsSchema.index({ timestamp: -1, eventType: 1 });
AnalyticsSchema.index({ sessionId: 1, timestamp: -1 });
AnalyticsSchema.index({ path: 1, timestamp: -1 });

// Static method to aggregate pageviews by path
AnalyticsSchema.statics.getPageviewStats = async function(startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        eventType: 'pageview',
        timestamp: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$path',
        count: { $sum: 1 },
        uniqueSessions: { $addToSet: '$sessionId' }
      }
    },
    {
      $project: {
        path: '$_id',
        views: '$count',
        uniqueVisitors: { $size: '$uniqueSessions' },
        _id: 0
      }
    },
    { $sort: { views: -1 } }
  ]);
};

// Static method to get session stats
AnalyticsSchema.statics.getSessionStats = async function(startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        timestamp: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$sessionId',
        events: { $sum: 1 },
        firstSeen: { $min: '$timestamp' },
        lastSeen: { $max: '$timestamp' },
        paths: { $addToSet: '$path' }
      }
    },
    {
      $project: {
        sessionId: '$_id',
        events: 1,
        duration: {
          $divide: [
            { $subtract: ['$lastSeen', '$firstSeen'] },
            1000 // Convert to seconds
          ]
        },
        pages: { $size: '$paths' },
        _id: 0
      }
    }
  ]);
};

export default mongoose.models.Analytics || mongoose.model('Analytics', AnalyticsSchema);
