import { z } from 'zod';
import mongoose from 'mongoose';

export function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

export const EntryCreateSchema = z.object({
  title: z.string().optional().default(''),
  body: z.string().min(1, 'Entry body is required'),
  mood: z.number().min(1).max(5).optional().default(3),
  tags: z.array(z.string()).optional().default([]),
});

export const EntryUpdateSchema = EntryCreateSchema.partial();
