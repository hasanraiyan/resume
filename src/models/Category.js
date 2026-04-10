import mongoose from 'mongoose';

const CategorySchema = new mongoose.Schema(
  {
    userId: { type: String, required: true }, // Added for multi-tenancy
    name: { type: String, required: true },
    type: { type: String, enum: ['income', 'expense'], required: true },
    icon: { type: String, default: 'dollar-sign' },
    color: { type: String, default: '#000000' },
    ignored: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    syncVersion: { type: Number, default: 1 },
  },
  { timestamps: true }
);

CategorySchema.index({ userId: 1 });

export default mongoose.models.Category || mongoose.model('Category', CategorySchema);
