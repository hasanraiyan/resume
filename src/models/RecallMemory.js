import mongoose from 'mongoose';

const RecallMemorySchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
    },
    qdrantId: {
      type: String,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Add text index for basic text search fallback if needed
RecallMemorySchema.index({ text: 'text' });

export default mongoose.models.RecallMemory || mongoose.model('RecallMemory', RecallMemorySchema);
