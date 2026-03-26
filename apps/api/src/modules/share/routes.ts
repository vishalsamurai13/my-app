import { shareAssetResponseSchema } from '@ai-clipart/shared';
import type { FastifyInstance } from 'fastify';
import type { AppRepository } from '@/lib/prisma/repository.js';
import { assetParamsSchema } from '@/schemas/http.js';

function isPublicShareUrl(url: string) {
  return /^https:\/\//.test(url) && !url.includes('localhost') && !url.includes('127.0.0.1') && !url.includes('10.0.2.2');
}

export async function shareRoutes(app: FastifyInstance, options: { repository: AppRepository }) {
  app.post('/share/:assetId', { preHandler: app.authenticate }, async (request, reply) => {
    const authUser = request.authUser!;
    const user = await options.repository.upsertUser(authUser);
    const { assetId } = assetParamsSchema.parse(request.params);
    const asset = await options.repository.getAssetForUser(assetId, user.id);

    if (!asset) {
      return reply.code(404).send('Asset not found.');
    }

    if (!isPublicShareUrl(asset.url)) {
      return reply.code(400).send('Asset is not publicly shareable yet.');
    }

    return shareAssetResponseSchema.parse({
      assetId: asset.id,
      shareUrl: asset.url,
    });
  });
}
