/**
 * @fileoverview MongoDB model for Telegram bot integration settings.
 * Stores configuration for Telegram bot notifications including bot token,
 * chat ID, and activation status. Implements singleton pattern for settings.
 *
 * This model manages Telegram bot integration with:
 * - Bot token storage for API authentication (encrypted)
 * - Chat ID configuration for message routing
 * - Enable/disable toggle for notification system
 * - Singleton pattern ensuring single configuration instance
 * - Automatic settings creation if none exist
 * - Integration with admin panel for configuration management
 *
 * @example
 * ```js
 * import TelegramSettings from '@/models/TelegramSettings';
 * import dbConnect from '@/lib/dbConnect';
 *
 * // Get current Telegram settings (creates default if none exist)
 * const settings = await TelegramSettings.getSettings();
 *
 * // Enable Telegram notifications
 * settings.isEnabled = true;
 * settings.botToken = 'encrypted-bot-token-here';
 * settings.chatId = 'your-chat-id';
 * await settings.save();
 *
 * // Disable Telegram notifications
 * settings.isEnabled = false;
 * await settings.save();
 *
 * // Check if notifications are enabled before sending
 * const currentSettings = await TelegramSettings.getSettings();
 * if (currentSettings.isEnabled) {
 *   // Send Telegram notification
 *   await sendTelegramNotification('New contact form submission received');
 * }
 *
 * // Update bot configuration
 * const existing = await TelegramSettings.getSettings();
 * existing.botToken = 'new-encrypted-token';
 * existing.chatId = 'new-chat-id';
 * await existing.save();
 * ```
 */

import mongoose from 'mongoose';

/**
 * Mongoose schema for TelegramSettings model.
 * Stores Telegram bot configuration for notification system integration.
 * Implements singleton pattern to maintain one configuration per application.
 *
 * @typedef {Object} TelegramSettings
 * @property {boolean} [isEnabled=false] - Whether Telegram notifications are active
 * @property {string|null} [botToken=null] - Encrypted Telegram bot token for API authentication
 * @property {string|null} [chatId=null] - Telegram chat ID for message delivery
 * @property {Date} createdAt - Auto-generated creation timestamp
 * @property {Date} updatedAt - Auto-generated update timestamp
 */
const TelegramSettingsSchema = new mongoose.Schema(
  {
    isEnabled: {
      type: Boolean,
      default: false,
    },
    botToken: {
      type: String, // Stored encrypted
      default: null,
    },
    chatId: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

/**
 * Static method to retrieve Telegram settings with singleton pattern.
 * Gets the existing settings document or creates a new one with default values
 * if none exists. Ensures there's always a settings document available.
 *
 * This method is the recommended way to access Telegram settings throughout
 * the application, providing consistent behavior and automatic initialization.
 *
 * @static
 * @async
 * @function getSettings
 * @returns {Promise<TelegramSettings>} The existing or newly created settings document
 *
 * @example
 * ```js
 * // In API routes or services
 * import TelegramSettings from '@/models/TelegramSettings';
 *
 * export async function sendNotification(message) {
 *   const settings = await TelegramSettings.getSettings();
 *
 *   if (!settings.isEnabled) {
 *     console.log('Telegram notifications are disabled');
 *     return;
 *   }
 *
 *   // Send notification using settings.botToken and settings.chatId
 *   await sendTelegramMessage(message, settings);
 * }
 *
 * // In admin panel for settings management
 * export async function updateTelegramSettings({ isEnabled, botToken, chatId }) {
 *   const settings = await TelegramSettings.getSettings();
 *   settings.isEnabled = isEnabled;
 *   settings.botToken = botToken; // Should be encrypted
 *   settings.chatId = chatId;
 *   return await settings.save();
 * }
 *
 * // Check settings status
 * const settings = await TelegramSettings.getSettings();
 * console.log('Telegram enabled:', settings.isEnabled);
 * console.log('Has bot token:', !!settings.botToken);
 * console.log('Has chat ID:', !!settings.chatId);
 * ```
 */
TelegramSettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

export default mongoose.models.TelegramSettings ||
  mongoose.model('TelegramSettings', TelegramSettingsSchema);
