import { z } from 'zod';
import mongoose from 'mongoose';

export function isValidObjectId(id) {
  return typeof id === 'string' && mongoose.Types.ObjectId.isValid(id);
}

export const CreateShortLinkSchema = z.object({
  slug: z.string().optional().nullable(),
  destination: z.string().min(1, 'Destination is required'),
  title: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
  expiresAt: z.union([z.string(), z.date()]).optional().nullable(),
  isActive: z.boolean().optional(),
  createdBy: z.string().optional().nullable(),
});

export const UpdateShortLinkSchema = z.object({
  id: z.string().optional(),
  slug: z.string().optional().nullable(),
  destination: z.string().optional(),
  title: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
  expiresAt: z.union([z.string(), z.date()]).optional().nullable(),
  isActive: z.boolean().optional(),
});

export const RecordClickSchema = z.object({
  slug: z.string().min(1),
  referrer: z.string().optional(),
  source: z.string().optional(),
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional(),
  country: z.string().optional(),
  device: z.string().optional(),
  browser: z.string().optional(),
  os: z.string().optional(),
  ipHash: z.string().optional(),
});
