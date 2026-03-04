import mongoose from 'mongoose';

const MediaAgentSettingsSchema = new mongoose.Schema(
  {
    // Global Media Settings
    qdrantCollection: {
      type: String,
      default: 'media_assets',
    },
    isProcessing: {
      type: Boolean,
      default: false,
    },
    processingStartedAt: {
      type: Date,
    },

    // Legacy support (fallbacks)
    providerId: String,
    model: String,
    generationProviderId: String,
    generationModel: String,
    embeddingProviderId: String,
    embeddingModel: String,
    persona: String,
  },
  {
    timestamps: true,
  }
);

// Singleton pattern & model initialization
MediaAgentSettingsSchema.pre('save', async function (next) {
  if (this.isNew) {
    const existing = await mongoose.models.MediaAgentSettings.findOne({});
    if (existing) {
      // If we're trying to save a new one but one already exists,
      // merge the data into the existing one.
      const data = this.toObject();
      delete data._id;
      Object.assign(existing, data);
      await existing.save();
      return next(new Error('MediaAgentSettings already exists. Use findOneAndUpdate instead.'));
    }
  }
  next();
});

export default mongoose.models.MediaAgentSettings ||
  mongoose.model('MediaAgentSettings', MediaAgentSettingsSchema);
