import mongoose from 'mongoose';

/**
 * @typedef {Object} ILinkClick
 * @property {mongoose.Types.ObjectId} shortLink - Reference to the ShortLink
 * @property {string} slug - Denormalized slug for faster querying
 * @property {Date} timestamp - Time the click occurred
 * @property {string} [referrer] - URL that referred the click
 * @property {string} [country] - Two-letter ISO country code
 * @property {string} [device] - Device type (e.g., Mobile, Desktop, Tablet)
 * @property {string} [browser] - Browser name
 * @property {string} [os] - Operating system
 * @property {string} [ipHash] - Hashed IP for calculating unique visitors
 */

const linkClickSchema = new mongoose.Schema(
  {
    shortLink: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ShortLink',
      required: true,
      index: true,
    },
    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    referrer: {
      type: String,
      trim: true,
      default: 'Direct',
    },
    country: {
      type: String,
      trim: true,
    },
    device: {
      type: String,
      trim: true,
    },
    browser: {
      type: String,
      trim: true,
    },
    os: {
      type: String,
      trim: true,
    },
    ipHash: {
      type: String,
      trim: true,
      index: true,
    },
  },
  {
    // Clicks are immutable, no need for updatedAt
    timestamps: { createdAt: 'timestamp', updatedAt: false },
  }
);

// Compound index for querying specific link clicks over time
linkClickSchema.index({ shortLink: 1, timestamp: -1 });

// Note: Future feature to consider adding is a TTL index if we want
// to automatically drop old analytics data to save space.
// linkClickSchema.index({ timestamp: 1 }, { expireAfterSeconds: 31536000 }); // 1 year

const LinkClick = mongoose.models.LinkClick || mongoose.model('LinkClick', linkClickSchema);

export default LinkClick;
