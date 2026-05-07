import mongoose from 'mongoose';

const JournalyEntrySchema = new mongoose.Schema(
  {
    title: { type: String, default: '' },
    body: { type: String, required: true },
    mood: { type: Number, min: 1, max: 5, default: 3 },
    tags: [{ type: String, lowercase: true, trim: true }],
    wordCount: { type: Number, default: 0 },
    qdrantId: { type: String, default: null },
    embeddedAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null },
    syncVersion: { type: Number, default: 1 },
  },
  { timestamps: true }
);

JournalyEntrySchema.index({ createdAt: -1 });
JournalyEntrySchema.index({ tags: 1 });
JournalyEntrySchema.index({ mood: 1 });
JournalyEntrySchema.index({ deletedAt: 1 });

export default mongoose.models.JournalyEntry || mongoose.model('JournalyEntry', JournalyEntrySchema);
