import { join } from 'node:path';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import fastifyStatic from '@fastify/static';
import Fastify from 'fastify';
import { ZodError } from 'zod';
import { MockAiProvider } from '@/lib/ai/mock-provider.js';
import { ReplicateAiProvider } from '@/lib/ai/replicate-provider.js';
import { env } from '@/lib/config/env.js';
import { createRepository } from '@/lib/prisma/repository.js';
import { JobOrchestrator } from '@/lib/queue/job-orchestrator.js';
import { CloudinaryStorageService } from '@/lib/storage/cloudinary-storage.js';
import { LocalStorageService } from '@/lib/storage/local-storage.js';
import { healthRoutes } from '@/modules/health/routes.js';
import { historyRoutes } from '@/modules/history/routes.js';
import { jobRoutes } from '@/modules/jobs/routes.js';
import { uploadRoutes } from '@/modules/uploads/routes.js';

export async function buildApp() {
  const app = Fastify({
    logger: true,
  });

  const storageRoot = join(process.cwd(), 'storage');
  const repository = createRepository(env.REPOSITORY_MODE, env.DATABASE_URL);
  const storage =
    env.STORAGE_MODE === 'cloudinary' &&
    env.CLOUDINARY_CLOUD_NAME &&
    env.CLOUDINARY_API_KEY &&
    env.CLOUDINARY_API_SECRET
      ? new CloudinaryStorageService(
          env.CLOUDINARY_CLOUD_NAME,
          env.CLOUDINARY_API_KEY,
          env.CLOUDINARY_API_SECRET,
          env.CLOUDINARY_FOLDER,
        )
      : new LocalStorageService(env.API_BASE_URL, storageRoot);
  const aiProvider =
    env.AI_PROVIDER === 'replicate' && env.REPLICATE_API_TOKEN && env.REPLICATE_MODEL
      ? new ReplicateAiProvider(
          env.REPLICATE_API_TOKEN,
          env.REPLICATE_MODEL,
          env.REPLICATE_VERSION,
          env.REPLICATE_IMAGE_FIELD,
          env.REPLICATE_PROMPT_FIELD,
        )
      : new MockAiProvider();
  const orchestrator = new JobOrchestrator(repository, aiProvider, storage);

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof ZodError) {
      return reply.code(400).send(error.flatten());
    }

    app.log.error(error);
    return reply.code(500).send('Internal server error');
  });

  await app.register(cors, { origin: true });
  await app.register(multipart, {
    limits: {
      fileSize: 8 * 1024 * 1024,
    },
  });
  await app.register(rateLimit, {
    max: 40,
    timeWindow: '1 minute',
  });
  await app.register(fastifyStatic, {
    root: storageRoot,
    prefix: '/storage/',
  });

  await healthRoutes(app, async () => ({
    ok: true,
    service: 'ai-clipart-api',
    provider: aiProvider.name,
    storage: storage.mode,
    repository: repository.mode,
    databaseConfigured: Boolean(env.DATABASE_URL),
    storageConfigured: await storage.healthCheck(),
  }));
  await uploadRoutes(app, { repository, storage });
  await jobRoutes(app, { repository, orchestrator });
  await historyRoutes(app, { repository });

  return app;
}
