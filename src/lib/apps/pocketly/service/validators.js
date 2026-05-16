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

export const BudgetCreateSchema = z.object({
  category: z.string(),
  amount: z.number().positive(),
  period: z.enum(['monthly', 'weekly', 'yearly']).default('monthly'),
});

export const BudgetUpdateSchema = BudgetCreateSchema.partial();

export const RecurringTransactionCreateSchema = z.object({
  type: z.enum(['income', 'expense', 'transfer']),
  amount: z.number().positive(),
  description: z.string().optional(),
  category: z.string().nullable().optional(),
  account: z.string(),
  toAccount: z.string().nullable().optional(),
  note: z.string().optional(),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  nextDueDate: z.union([z.string(), z.date()]),
  endDate: z.union([z.string(), z.date()]).nullable().optional(),
  isActive: z.boolean().default(true),
});

export const RecurringTransactionUpdateSchema = RecurringTransactionCreateSchema.partial();

export const SavingsGoalCreateSchema = z.object({
  name: z.string().min(1),
  targetAmount: z.number().positive(),
  currentAmount: z.number().nonnegative().default(0),
  targetDate: z.union([z.string(), z.date(), z.null()]).optional(),
  icon: z.string().default('target'),
  color: z.string().default('#1f644e'),
  isCompleted: z.boolean().default(false),
});

export const SavingsGoalUpdateSchema = SavingsGoalCreateSchema.partial();
