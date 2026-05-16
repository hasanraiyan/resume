import mongoose from 'mongoose';

/**
 * ProviderSettings Schema
 *
 * Centralized configuration for AI API Providers (e.g., OpenAI, Google, Anthropic).
 * Replaces the disparate arrays within ChatbotSettings.
 */
const { Schema } = mongoose;

/**
 * ProviderSettings Schema
 *
 * Centralized configuration for AI API Providers (e.g., OpenAI, Google, Anthropic).
 * Replaces the disparate arrays within ChatbotSettings.
 */
const ProviderSettingsSchema = new Schema(
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
      type: Schema.Types.Mixed,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    supportsTools: {
      type: Boolean,
      default: true,
    },
    defaultRPM: {
      type: Number,
      default: 4, // Gemini 3 Flash Free Tier default
    },
    defaultTPM: {
      type: Number,
      default: 250000, // 250K default
    },
    defaultRPD: {
      type: Number,
      default: 2000, // 2K default (Gemini is often 1500-2000)
    },
    enableLimits: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    minimize: false, // Ensure empty objects/arrays are stored if needed
  }
);

// Optional: Decryption method or middleware could go here if `crypto.js` logic is moved to Model level

// Fix for Next.js HMR: Delete the model from cache to force re-registration with new schema
if (process.env.NODE_ENV === 'development' && mongoose.models.ProviderSettings) {
  delete mongoose.models.ProviderSettings;
}

export default mongoose.models.ProviderSettings ||
  mongoose.model('ProviderSettings', ProviderSettingsSchema);
