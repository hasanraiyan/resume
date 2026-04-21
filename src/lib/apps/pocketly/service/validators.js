import { z } from 'zod';
import mongoose from 'mongoose';

export function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

export const DraftTransactionSchema = z.object({
  type: z.enum(['income', 'expense', 'transfer']),
  amount: z.number().positive(),
  description: z.string().optional(),
  category: z.string().nullable().optional(),
  account: z.string(),
  toAccount: z.string().nullable().optional(),
  date: z.union([z.string(), z.date()]).optional(),
  note: z.string().optional(),
});

export const TransactionCreateSchema = z.object({
  type: z.enum(['income', 'expense', 'transfer']),
  amount: z.number().positive(),
  description: z.string().optional(),
  category: z.string().nullable().optional(),
  account: z.string(),
  toAccount: z.string().nullable().optional(),
  date: z.union([z.string(), z.date()]),
  note: z.string().optional(),
});

export const TransactionUpdateSchema = TransactionCreateSchema.partial();
