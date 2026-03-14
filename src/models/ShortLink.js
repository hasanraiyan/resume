import mongoose from 'mongoose';

/**
 * List of reserved slugs that cannot be used for short links to prevent
 * conflicts with existing routes or reserved paths.
 */
const RESERVED_SLUGS = [
  'admin',
  'api',
  'login',
  'dashboard',
  'auth',
  'r',
  'projects',
  'blog',
  'about',
  'contact',
  'resume',
  'search',
  'subscribe',
  'tools',
  'offline',
];

/**
 * @typedef {Object} IShortLink
 * @property {string} slug - The unique, lowercase, alphanumeric identifier for the short link
 * @property {string} destination - The target URL where the user will be redirected
 * @property {string} [title] - Optional title for admin reference
 * @property {string} [description] - Optional description for detailed context
 * @property {mongoose.Types.ObjectId} [createdBy] - Reference to the User who created the link
 * @property {string[]} [tags] - Array of tags for categorization
 * @property {Date} [expiresAt] - Optional expiration date, after which the link becomes inactive
 * @property {boolean} isActive - Whether the short link is currently active
 * @property {number} totalClicks - Denormalized counter for quick stats retrieval
 * @property {Date} createdAt - Timestamp of creation
 * @property {Date} updatedAt - Timestamp of last update
 */

const shortLinkSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'],
      validate: {
        validator: function (v) {
          return !RESERVED_SLUGS.includes(v);
        },
        message: (props) => `${props.value} is a reserved slug and cannot be used`,
      },
    },
    destination: {
      type: String,
      required: [true, 'Destination URL is required'],
      trim: true,
      validate: {
        validator: function (v) {
          // Basic URL validation
          try {
            new URL(v);
            return true;
          } catch (err) {
            return false;
          }
        },
        message: (props) => `${props.value} is not a valid URL`,
      },
    },
    title: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    expiresAt: {
      type: Date,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    totalClicks: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Optimize for the main redirect query: find active link by slug
shortLinkSchema.index({ slug: 1, isActive: 1 });

const ShortLink = mongoose.models.ShortLink || mongoose.model('ShortLink', shortLinkSchema);

export default ShortLink;
