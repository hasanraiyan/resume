import { z } from 'zod';
import mongoose from 'mongoose';

export const isValidObjectId = (val) => mongoose.Types.ObjectId.isValid(val);

export const CreateFolderSchema = z.object({
  name: z.string().min(1).max(255),
  parentId: z
    .string()
    .nullable()
    .optional()
    .refine((val) => !val || isValidObjectId(val), {
      message: 'Invalid parentId',
    }),
});

export const UpdateFolderSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  parentId: z
    .string()
    .nullable()
    .optional()
    .refine((val) => !val || isValidObjectId(val), {
      message: 'Invalid parentId',
    }),
  starred: z.boolean().optional(),
  restore: z.boolean().optional(),
});

export const UpdateFileSchema = z.object({
  filename: z.string().min(1).max(255).optional(),
  folderId: z
    .string()
    .nullable()
    .optional()
    .refine((val) => !val || isValidObjectId(val), {
      message: 'Invalid folderId',
    }),
  starred: z.boolean().optional(),
  restore: z.boolean().optional(),
});

export const BulkActionSchema = z.object({
  fileIds: z.array(z.string().refine(isValidObjectId)).optional(),
  folderIds: z.array(z.string().refine(isValidObjectId)).optional(),
  action: z.enum(['delete', 'restore', 'star', 'unstar', 'move']),
  targetFolderId: z.string().nullable().optional(),
});
