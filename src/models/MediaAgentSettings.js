import mongoose from 'mongoose';

const MediaAgentSettingsSchema = new mongoose.Schema(
  {
    providerId: {
      type: String,
      default: '',
    },
    model: {
      type: String,
      default: '',
    },
    persona: {
      type: String,
      default:
        'You are an AI Image Analyzer. Your goal is to provide a brief, accurate, and descriptive title or caption for the given image. The description should be suitable for use as alt text or a short caption. Focus on the main subject and key visual elements.',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isProcessing: {
      type: Boolean,
      default: false,
    },
    processingStartedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Singleton pattern
MediaAgentSettingsSchema.pre('save', async function (next) {
  if (this.isNew) {
    const existing = await mongoose.models.MediaAgentSettings.findOne({});
    if (existing) {
      Object.assign(existing, this.toObject());
      await existing.save();
      return next(new Error('MediaAgentSettings already exists. Use findOneAndUpdate instead.'));
    }
  }
  next();
});

export default mongoose.models.MediaAgentSettings ||
  mongoose.model('MediaAgentSettings', MediaAgentSettingsSchema);
