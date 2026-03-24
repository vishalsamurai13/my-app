import { z } from 'zod';
import { STYLE_TASK_STATUSES } from '../domain/generation';
import { STYLE_TYPES } from '../constants/styles';

export const styleTypeSchema = z.enum(STYLE_TYPES);
export const styleTaskStatusSchema = z.enum(STYLE_TASK_STATUSES);

export const uploadResponseSchema = z.object({
  uploadId: z.string(),
  originalUrl: z.string().url(),
});

export const createJobBodySchema = z.object({
  uploadId: z.string(),
  styles: z.array(styleTypeSchema).min(1),
});

export const assetSchema = z.object({
  id: z.string(),
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
  deviceId: z.string(),
  uploadId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  promptVersion: z.string(),
  status: styleTaskStatusSchema,
  styles: z.array(assetSchema),
});

export const createJobResponseSchema = z.object({
  jobId: z.string(),
});

export const historyResponseSchema = z.object({
  jobs: z.array(generationJobSchema),
});
