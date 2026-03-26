import { meResponseSchema } from '@ai-clipart/shared';
import type { FastifyInstance } from 'fastify';
import type { AppRepository } from '@/lib/prisma/repository.js';

export async function meRoutes(app: FastifyInstance, options: { repository: AppRepository }) {
  app.get('/me', { preHandler: app.authenticate }, async (request) => {
    const authUser = request.authUser!;
    const user = await options.repository.upsertUser(authUser);
    return meResponseSchema.parse(user);
  });
}
