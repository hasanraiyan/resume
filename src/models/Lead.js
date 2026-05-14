import mongoose from 'mongoose';

/**
 * @fileoverview Generic Lead model for capturing form responses, waitlists, and inquiries.
 * Designed to be highly flexible for any type of user-submitted data.
 */

const LeadSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      index: true,
      // Examples: 'coursify-creator-waitlist', 'beta-tester', 'product-inquiry'
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
      index: true,
    },
    name: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['new', 'contacted', 'qualified', 'converted', 'rejected', 'archived'],
      default: 'new',
      index: true,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
      // Stores any additional fields: { reason: '...', experience: '...' }
    },
    metadata: {
      ipAddress: String,
      userAgent: String,
      referrer: String,
      path: String,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent re-submission of same email for same type
LeadSchema.index({ type: 1, email: 1 }, { unique: true });

export default mongoose.models.Lead || mongoose.model('Lead', LeadSchema);
