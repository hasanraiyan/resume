// src/models/TelegramSettings.js
import mongoose from 'mongoose';

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

// Static method to get the singleton settings document, creating it if it doesn't exist
TelegramSettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

export default mongoose.models.TelegramSettings ||
  mongoose.model('TelegramSettings', TelegramSettingsSchema);
