import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  API_BASE_URL: z.string().url().default('http://10.0.2.2:4000'),
  DATABASE_URL: z.string().optional(),
  REPLICATE_API_TOKEN: z.string().optional(),
  STORAGE_MODE: z.enum(['local', 'cloudinary']).default('local'),
});

export type AppEnv = z.infer<typeof envSchema>;

export const env = envSchema.parse(process.env);
