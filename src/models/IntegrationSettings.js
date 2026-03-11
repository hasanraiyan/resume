import mongoose from 'mongoose';

/**
 * IntegrationSettings Schema
 *
 * Centralized configuration for external platform integrations (e.g., Telegram, WhatsApp).
 * These act as I/O channels that route incoming messages to specific AI agents.
 */
const IntegrationSettingsSchema = new mongoose.Schema(
  {
    integrationId: {
      type: String,
      required: true,
      unique: true,
    },
    platform: {
      type: String,
      required: true,
      enum: ['telegram', 'whatsapp', 'slack', 'twilio'], // Extendable
    },
    name: {
      type: String,
      required: true,
    },
    // Credentials vary by platform (e.g., botToken/telegramAuthToken for Telegram,
    // accountSid/authToken for Twilio WhatsApp).
    // These are encrypted at rest using the crypto utility before saving.
    credentials: {
      type: Map,
      of: String,
      default: {},
    },
    // The specific AI agent that handles messages from this integration
    agentId: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Platform-specific runtime state, such as Telegram authorized chat allowlists.
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.IntegrationSettings ||
  mongoose.model('IntegrationSettings', IntegrationSettingsSchema);
