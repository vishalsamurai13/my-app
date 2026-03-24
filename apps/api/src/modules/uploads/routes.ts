import { extension as mimeExtension } from 'mime-types';
import { v4 as uuid } from 'uuid';
import type { FastifyInstance } from 'fastify';
import type { AppRepository } from '@/lib/prisma/repository.js';
import { LocalStorageService } from '@/lib/storage/local-storage.js';

export async function uploadRoutes(
  app: FastifyInstance,
  options: { repository: AppRepository; storage: LocalStorageService },
) {
  app.post('/uploads', async (request, reply) => {
    const deviceId = request.headers['x-device-id'];

    if (!deviceId || typeof deviceId !== 'string') {
      return reply.code(400).send('Missing x-device-id header.');
    }

    const file = await request.file();

    if (!file) {
      return reply.code(400).send('Image file is required.');
    }

    const mimeType = file.mimetype;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(mimeType)) {
      return reply.code(400).send('Only JPG, PNG, and WEBP are allowed.');
    }

    const buffer = await file.toBuffer();
    const extension = mimeExtension(mimeType) || 'jpg';
    const stored = await options.storage.saveUpload({
      buffer,
      extension: extension.toString(),
      folder: 'uploads',
    });

    const upload = await options.repository.saveUpload({
      id: uuid(),
      deviceId,
      storageKey: stored.storageKey,
      url: stored.url,
      mimeType,
      fileName: file.filename || `upload-${Date.now()}.${extension}`,
    });

    return {
      uploadId: upload.id,
      originalUrl: upload.url,
    };
  });
}
