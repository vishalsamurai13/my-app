import type { FastifyInstance } from 'fastify';
import type { AppHealth } from '@/types/app.js';

export async function healthRoutes(
  app: FastifyInstance,
  statusProvider: () => Promise<AppHealth>,
) {
  app.get('/health', async () => statusProvider());
}
