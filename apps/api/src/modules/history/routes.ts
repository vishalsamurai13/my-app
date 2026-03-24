import type { FastifyInstance } from 'fastify';
import type { AppRepository } from '@/lib/prisma/repository.js';
import { deviceHeaderSchema } from '@/schemas/http.js';

export async function historyRoutes(
  app: FastifyInstance,
  options: { repository: AppRepository },
) {
  app.get('/history', async (request, reply) => {
    const { 'x-device-id': deviceId } = deviceHeaderSchema.parse(request.headers);

    return {
      jobs: await options.repository.listJobsByDevice(deviceId),
    };
  });
}
