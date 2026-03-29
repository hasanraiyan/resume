import mongoose from 'mongoose';

const FinanceCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    icon: { type: String, required: true },
    type: { type: String, enum: ['income', 'expense'], required: true },
    color: { type: String, default: '#000000' },
    displayOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.models.FinanceCategory ||
  mongoose.model('FinanceCategory', FinanceCategorySchema);
