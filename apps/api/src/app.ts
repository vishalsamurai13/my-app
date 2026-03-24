import { join } from 'node:path';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import fastifyStatic from '@fastify/static';
import Fastify from 'fastify';
import { MockAiProvider } from '@/lib/ai/mock-provider.js';
import { env } from '@/lib/config/env.js';
import { createRepository } from '@/lib/prisma/repository.js';
import { JobOrchestrator } from '@/lib/queue/job-orchestrator.js';
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
  const repository = createRepository();
  const storage = new LocalStorageService(env.API_BASE_URL, storageRoot);
  const aiProvider = new MockAiProvider();
  const orchestrator = new JobOrchestrator(repository, aiProvider, storage);

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

  await healthRoutes(app);
  await uploadRoutes(app, { repository, storage });
  await jobRoutes(app, { repository, orchestrator });
  await historyRoutes(app, { repository });

  return app;
}
