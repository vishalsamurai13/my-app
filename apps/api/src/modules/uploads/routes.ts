import { extension as mimeExtension } from 'mime-types';
import { v4 as uuid } from 'uuid';
import type { FastifyInstance } from 'fastify';
import type { AppRepository } from '@/lib/prisma/repository.js';
import type { StorageProvider } from '@/lib/storage/provider.js';

export async function uploadRoutes(
  app: FastifyInstance,
  options: { repository: AppRepository; storage: StorageProvider },
) {
  app.post('/uploads', { preHandler: app.authenticate }, async (request, reply) => {
    const authUser = request.authUser!;
    const user = await options.repository.upsertUser(authUser);

    const file = await request.file();

    if (!file) {
      return reply.code(400).send('Image file is required.');
    }

    const mimeType = file.mimetype;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(mimeType)) {
      return reply.code(400).send('Only JPG, PNG, and WEBP are allowed.');
    }

    const buffer = await file.toBuffer();
    if (buffer.byteLength > 8 * 1024 * 1024) {
      return reply.code(400).send('Image exceeds the maximum size limit.');
    }

    const extension = mimeExtension(mimeType) || 'jpg';
    const stored = await options.storage.saveAsset({
      buffer,
      extension: extension.toString(),
      folder: 'uploads',
      mimeType,
    });

    const upload = await options.repository.saveUpload({
      id: uuid(),
      userId: user.id,
      storageKey: stored.storageKey,
      url: stored.url,
      mimeType,
      fileName: file.filename || `upload-${Date.now()}.${extension}`,
    });

    request.log.info({ uploadId: upload.id, userId: user.id }, 'upload created');

    return {
      uploadId: upload.id,
      originalUrl: upload.url,
    };
  });
}
