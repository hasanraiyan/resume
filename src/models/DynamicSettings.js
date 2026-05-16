import mongoose from 'mongoose';

/**
 * DynamicSettings Schema
 * Stores encrypted configuration values (like Redis URLs, API keys for other services)
 * that would normally be in .env files.
 */
const DynamicSettingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    value: {
      type: String, // Stored encrypted
      required: true,
    },
    description: {
      type: String,
    },
    isEncrypted: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.DynamicSettings ||
  mongoose.model('DynamicSettings', DynamicSettingsSchema);
