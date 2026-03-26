import { rm } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { MockAiProvider } from '@/lib/ai/mock-provider.js';
import { AiProviderError, type AiProvider } from '@/lib/ai/provider.js';
import { FileRepository } from '@/lib/prisma/repository.js';
import { JobOrchestrator } from '@/lib/queue/job-orchestrator.js';
import { LocalStorageService } from '@/lib/storage/local-storage.js';

describe('JobOrchestrator', () => {
  it('processes queued styles into success assets', async () => {
    await rm('/tmp/ai-clipart-test-repo.json', { force: true });
    await rm('/tmp/ai-clipart-storage', { recursive: true, force: true });

    const repository = new FileRepository('/tmp/ai-clipart-test-repo.json');
    await repository.upsertUser({
      clerkUserId: 'clerk-user-1',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      imageUrl: null,
    });
    await repository.saveUpload({
      id: 'upload-1',
      userId: 'clerk-user-1',
      storageKey: 'uploads/test.jpg',
      url: 'http://localhost:4000/storage/uploads/test.jpg',
      mimeType: 'image/jpeg',
      fileName: 'test.jpg',
    });

    const job = await repository.createJob({
      userId: 'clerk-user-1',
      uploadId: 'upload-1',
      promptVersion: 'v1',
      prompt: 'Portrait in warm light',
      shape: 'square',
      provider: 'mock',
      model: 'local-svg-mock',
      styles: ['anime', 'cartoon'],
    });

    const orchestrator = new JobOrchestrator(
      repository,
      new MockAiProvider(),
      new LocalStorageService('http://localhost:4000', '/tmp/ai-clipart-storage'),
    );

    orchestrator.enqueue(job.id);

    let updated = await repository.getJob(job.id);
    for (let attempt = 0; attempt < 10; attempt += 1) {
      updated = await repository.getJob(job.id);
      if (updated?.styles.every((style) => style.status === 'success')) {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    expect(updated?.styles.every((style) => style.status === 'success')).toBe(true);
  });

  it('retries one transient provider failure before succeeding', async () => {
    await rm('/tmp/ai-clipart-test-repo-retry.json', { force: true });
    await rm('/tmp/ai-clipart-storage-retry', { recursive: true, force: true });

    const repository = new FileRepository('/tmp/ai-clipart-test-repo-retry.json');
    const user = await repository.upsertUser({
      clerkUserId: 'clerk-user-2',
      email: 'retry@example.com',
      firstName: 'Retry',
      lastName: 'User',
      imageUrl: null,
    });
    await repository.saveUpload({
      id: 'upload-2',
      userId: user.id,
      storageKey: 'uploads/retry.jpg',
      url: 'http://localhost:4000/storage/uploads/retry.jpg',
      mimeType: 'image/jpeg',
      fileName: 'retry.jpg',
    });

    const job = await repository.createJob({
      userId: user.id,
      uploadId: 'upload-2',
      promptVersion: 'v1',
      prompt: 'Portrait in warm light',
      shape: 'square',
      provider: 'mock',
      model: 'retry-mock',
      styles: ['cartoon'],
    });

    let attempts = 0;
    const flakyProvider: AiProvider = {
      name: 'mock',
      model: 'retry-mock',
      async generateStyleVariant() {
        attempts += 1;
        if (attempts === 1) {
          throw new AiProviderError('Temporary provider failure', { retryable: true });
        }

        return new MockAiProvider().generateStyleVariant({
          style: 'cartoon',
          promptVersion: 'v1',
          prompt: 'Portrait in warm light',
          sourceImageUrl: 'http://localhost:4000/storage/uploads/retry.jpg',
        });
      },
    };

    const orchestrator = new JobOrchestrator(
      repository,
      flakyProvider,
      new LocalStorageService('http://localhost:4000', '/tmp/ai-clipart-storage-retry'),
    );

    orchestrator.enqueue(job.id);

    let updated = await repository.getJob(job.id);
    for (let attempt = 0; attempt < 20; attempt += 1) {
      updated = await repository.getJob(job.id);
      if (updated?.styles.every((style) => style.status === 'success')) {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    expect(attempts).toBe(2);
    expect(updated?.styles[0]?.status).toBe('success');
  });
});
