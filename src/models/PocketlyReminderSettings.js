import mongoose from 'mongoose';

const PocketlyReminderSettingsSchema = new mongoose.Schema(
  {
    isEnabled: {
      type: Boolean,
      default: false,
    },
    reminderTime: {
      type: String,
      default: '21:00',
    },
    timezone: {
      type: String,
      default: 'Asia/Kolkata',
    },
    reminderMode: {
      type: String,
      enum: ['if_no_transactions', 'always'],
      default: 'if_no_transactions',
    },
    lastReminderSentAt: {
      type: Date,
      default: null,
    },
    lastReminderSentDate: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

PocketlyReminderSettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

export default mongoose.models.PocketlyReminderSettings ||
  mongoose.model('PocketlyReminderSettings', PocketlyReminderSettingsSchema);
