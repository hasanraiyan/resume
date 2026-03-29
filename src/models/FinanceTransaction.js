import mongoose from 'mongoose';

const FinanceTransactionSchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true },
    type: { type: String, enum: ['income', 'expense'], required: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'FinanceCategory', required: true },
    date: { type: Date, default: Date.now },
    note: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.models.FinanceTransaction ||
  mongoose.model('FinanceTransaction', FinanceTransactionSchema);
