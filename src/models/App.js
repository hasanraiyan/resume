import mongoose from 'mongoose';

/**
 * App Schema
 *
 * Represents a mini-app (either AI-generated or manually created)
 * that runs within the admin panel as a standalone tool.
 */
const AppSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    icon: {
      type: String,
      default: 'Layout',
      trim: true,
    },
    type: {
      type: String,
      enum: ['ai', 'manual'],
      required: true,
    },
    designSchema: {
      type: String,
      default: 'modern',
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.App || mongoose.model('App', AppSchema);
