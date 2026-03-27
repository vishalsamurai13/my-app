import { z } from 'zod';
import { SHAPE_TYPES, STYLE_TASK_STATUSES } from '../domain/generation.js';
import { STYLE_TYPES } from '../constants/styles.js';

export const styleTypeSchema = z.enum(STYLE_TYPES);
export const styleTaskStatusSchema = z.enum(STYLE_TASK_STATUSES);
export const shapeTypeSchema = z.enum(SHAPE_TYPES);

export const uploadResponseSchema = z.object({
  uploadId: z.string(),
  originalUrl: z.string().url(),
});

export const createJobBodySchema = z.object({
  uploadId: z.string(),
  prompt: z.string().trim().max(1000).optional(),
  shape: shapeTypeSchema.optional(),
  styles: z.array(styleTypeSchema).min(1).max(4),
});

export const assetSchema = z.object({
  id: z.string(),
  assetId: z.string().optional(),
  style: styleTypeSchema,
  status: styleTaskStatusSchema,
  mimeType: z.string().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  url: z.string().url().optional(),
  storageKey: z.string().optional(),
  error: z.string().nullable().optional(),
});

export const generationJobSchema = z.object({
  id: z.string(),
  userId: z.string(),
  uploadId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  promptVersion: z.string(),
  prompt: z.string().nullable().optional(),
  shape: shapeTypeSchema.nullable().optional(),
  provider: z.string().optional(),
  model: z.string().optional(),
  status: styleTaskStatusSchema,
  styles: z.array(assetSchema),
});

export const createJobResponseSchema = z.object({
  jobId: z.string(),
});

export const meResponseSchema = z.object({
  id: z.string(),
  clerkUserId: z.string(),
  email: z.string().email().nullable(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  imageUrl: z.string().url().nullable(),
  displayName: z.string().nullable(),
  dateOfBirth: z.string().nullable(),
});

export const updateMeBodySchema = z.object({
  displayName: z.string().trim().max(80).nullable().optional(),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must be in YYYY-MM-DD format.')
    .nullable()
    .optional(),
});

export const historyResponseSchema = z.object({
  jobs: z.array(generationJobSchema),
});

export const shareAssetResponseSchema = z.object({
  assetId: z.string(),
  shareUrl: z.string().url(),
});
