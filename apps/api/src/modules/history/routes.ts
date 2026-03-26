import type { FastifyInstance } from 'fastify';
import type { AppRepository } from '@/lib/prisma/repository.js';

export async function historyRoutes(
  app: FastifyInstance,
  options: { repository: AppRepository },
) {
  app.get('/history', { preHandler: app.authenticate }, async (request) => {
    const authUser = request.authUser!;
    const user = await options.repository.upsertUser(authUser);

    return {
      jobs: await options.repository.listJobsByUser(user.id),
    };
  });
}
