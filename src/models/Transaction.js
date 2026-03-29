import mongoose from 'mongoose';

const TransactionSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['income', 'expense', 'transfer'], required: true },
    amount: { type: Number, required: true },
    description: { type: String, default: '' },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      required: true,
    },
    toAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      default: null,
    },
    date: { type: Date, required: true },
    note: { type: String, default: '' },
    deletedAt: { type: Date, default: null },
    syncVersion: { type: Number, default: 1 },
  },
  { timestamps: true }
);

TransactionSchema.index({ date: -1 });
TransactionSchema.index({ account: 1 });
TransactionSchema.index({ category: 1 });
TransactionSchema.index({ type: 1 });

export default mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);
