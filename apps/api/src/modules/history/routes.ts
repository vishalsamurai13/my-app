import type { FastifyInstance } from 'fastify';
import type { AppRepository } from '@/lib/prisma/repository.js';

export async function historyRoutes(
  app: FastifyInstance,
  options: { repository: AppRepository },
) {
  app.get('/history', async (request, reply) => {
    const deviceId = request.headers['x-device-id'];

    if (!deviceId || typeof deviceId !== 'string') {
      return reply.code(400).send('Missing x-device-id header.');
    }

    return {
      jobs: await options.repository.listJobsByDevice(deviceId),
    };
  });
}
