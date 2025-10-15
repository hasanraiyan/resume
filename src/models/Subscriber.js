/**
 * @fileoverview MongoDB model for newsletter subscribers.
 * Manages email subscriptions with duplicate prevention and timestamp tracking.
 * Supports integration with email marketing services like Mailchimp.
 */

import mongoose from 'mongoose';

/**
 * Mongoose schema for Subscriber model.
 * Stores newsletter subscription data with email uniqueness and timestamps.
 *
 * @typedef {Object} Subscriber
 * @property {string} email - Subscriber's email address (required, unique)
 * @property {string} name - Subscriber's name (optional)
 * @property {boolean} isActive - Whether the subscription is active (default: true)
 * @property {string} source - Where the subscription came from (e.g., 'footer', 'blog')
 * @property {Date} subscribedAt - When the subscription was created
 * @property {Date} unsubscribedAt - When the subscription was cancelled (if applicable)
 * @property {Object} metadata - Additional metadata (e.g., IP address, user agent)
 * @property {Date} createdAt - Auto-generated creation timestamp
 * @property {Date} updatedAt - Auto-generated update timestamp
 */
const SubscriberSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
      index: true,
    },
    name: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    source: {
      type: String,
      enum: ['footer', 'blog', 'project', 'contact', 'admin', 'import'],
      default: 'footer',
      index: true,
    },
    subscribedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    unsubscribedAt: {
      type: Date,
      index: true,
    },
    metadata: {
      ipAddress: String,
      userAgent: String,
      referrer: String,
    },
  },
  {
    timestamps: true,
  }
);

// Create compound index for efficient queries
SubscriberSchema.index({
  email: 1,
  isActive: 1,
});

// Create index for subscription date queries
SubscriberSchema.index({ subscribedAt: -1 });

// Pre-save middleware to set subscribedAt for new documents
SubscriberSchema.pre('save', function (next) {
  if (this.isNew && !this.subscribedAt) {
    this.subscribedAt = new Date();
  }
  next();
});

// Static method to find active subscribers
SubscriberSchema.statics.findActive = function () {
  return this.find({ isActive: true });
};

// Static method to find subscribers by source
SubscriberSchema.statics.findBySource = function (source) {
  return this.find({ source, isActive: true });
};

// Instance method to unsubscribe
SubscriberSchema.methods.unsubscribe = function () {
  this.isActive = false;
  this.unsubscribedAt = new Date();
  return this.save();
};

// Instance method to resubscribe
SubscriberSchema.methods.resubscribe = function () {
  this.isActive = true;
  this.unsubscribedAt = undefined;
  return this.save();
};

export default mongoose.models.Subscriber || mongoose.model('Subscriber', SubscriberSchema);
