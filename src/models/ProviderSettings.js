import mongoose from 'mongoose';

/**
 * ProviderSettings Schema
 *
 * Centralized configuration for AI API Providers (e.g., OpenAI, Google, Anthropic).
 * Replaces the disparate arrays within ChatbotSettings.
 */
const ProviderSettingsSchema = new mongoose.Schema(
  {
    providerId: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    baseUrl: {
      type: String,
      required: true,
    },
    apiKey: {
      type: String,
      required: true, // Will be encrypted at rest in production
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    supportsTools: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Optional: Decryption method or middleware could go here if `crypto.js` logic is moved to Model level

export default mongoose.models.ProviderSettings ||
  mongoose.model('ProviderSettings', ProviderSettingsSchema);
