import { meResponseSchema, updateMeBodySchema } from '@ai-clipart/shared';
import type { FastifyInstance } from 'fastify';
import type { AppRepository } from '@/lib/prisma/repository.js';

export async function meRoutes(app: FastifyInstance, options: { repository: AppRepository }) {
  app.get('/me', { preHandler: app.authenticate }, async (request) => {
    const authUser = request.authUser!;
    const user = await options.repository.upsertUser(authUser);
    return meResponseSchema.parse(user);
  });

  app.patch('/me', { preHandler: app.authenticate }, async (request) => {
    const authUser = request.authUser!;
    const user = await options.repository.upsertUser(authUser);
    const body = updateMeBodySchema.parse(request.body);
    const updatedUser = await options.repository.updateUserProfile(user.id, {
      displayName: body.displayName ?? null,
      dateOfBirth: body.dateOfBirth ?? null,
    });

    request.log.info({ userId: user.id }, 'profile updated');
    return meResponseSchema.parse(updatedUser);
  });
}
