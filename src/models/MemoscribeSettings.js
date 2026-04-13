import mongoose from 'mongoose';

const MemoscribeSettingsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    qdrantUrl: {
      type: String,
      required: false,
    },
    qdrantApiKey: {
      type: String, // This will store the encrypted string
      required: false,
    },
  },
  { timestamps: true }
);

export default mongoose.models.MemoscribeSettings ||
  mongoose.model('MemoscribeSettings', MemoscribeSettingsSchema);
