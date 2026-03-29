import mongoose from 'mongoose';

const FinanceSyncStateSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'singleton', unique: true },
    resetVersion: { type: Number, default: 0 },
    resetAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.models.FinanceSyncState ||
  mongoose.model('FinanceSyncState', FinanceSyncStateSchema);
