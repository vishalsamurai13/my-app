import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';
import { z } from 'zod';

const currentDir = dirname(fileURLToPath(import.meta.url));
const apiRoot = resolve(currentDir, '../../..');
const workspaceRoot = resolve(currentDir, '../../../../..');

loadEnv({ path: resolve(workspaceRoot, '.env') });
loadEnv({ path: resolve(apiRoot, '.env'), override: false });

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  API_BASE_URL: z.string().url().default('http://10.0.2.2:4000'),
  AI_PROVIDER: z.enum(['mock', 'replicate']).default('mock'),
  PROMPT_VERSION: z.string().default('v1'),
  REPOSITORY_MODE: z.enum(['file', 'prisma']).default('file'),
  DATABASE_URL: z.string().optional(),
  CLERK_SECRET_KEY: z.string().optional(),
  REPLICATE_API_TOKEN: z.string().optional(),
  REPLICATE_MODEL: z.string().optional(),
  REPLICATE_VERSION: z.string().optional(),
  REPLICATE_IMAGE_FIELD: z.string().default('image'),
  REPLICATE_PROMPT_FIELD: z.string().default('prompt'),
  STORAGE_MODE: z.enum(['local', 'cloudinary']).default('local'),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  CLOUDINARY_FOLDER: z.string().default('ai-clipart-generator'),
});

export type AppEnv = z.infer<typeof envSchema>;

export const env = envSchema.parse(process.env);
