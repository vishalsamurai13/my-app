import { z } from 'zod';
import { styleTypeSchema } from '@ai-clipart/shared';

export const authorizationHeaderSchema = z.object({
  authorization: z.string().min(1),
});

export const jobParamsSchema = z.object({
  jobId: z.string().min(1),
});

export const retryParamsSchema = z.object({
  jobId: z.string().min(1),
  style: styleTypeSchema,
});
