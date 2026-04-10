import mongoose from 'mongoose';

const AccountSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true }, // Added for multi-tenancy
    name: { type: String, required: true },
    icon: { type: String, default: 'wallet' },
    initialBalance: { type: Number, default: 0 },
    currency: { type: String, default: 'INR' },
    ignored: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    syncVersion: { type: Number, default: 1 },
  },
  { timestamps: true }
);

AccountSchema.index({ userId: 1 });

export default mongoose.models.Account || mongoose.model('Account', AccountSchema);
