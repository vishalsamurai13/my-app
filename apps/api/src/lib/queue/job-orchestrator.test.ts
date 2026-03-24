import { rm } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { MockAiProvider } from '@/lib/ai/mock-provider.js';
import { FileRepository } from '@/lib/prisma/repository.js';
import { JobOrchestrator } from '@/lib/queue/job-orchestrator.js';
import { LocalStorageService } from '@/lib/storage/local-storage.js';

describe('JobOrchestrator', () => {
  it('processes queued styles into success assets', async () => {
    await rm('/tmp/ai-clipart-test-repo.json', { force: true });
    await rm('/tmp/ai-clipart-storage', { recursive: true, force: true });

    const repository = new FileRepository('/tmp/ai-clipart-test-repo.json');
    await repository.saveUpload({
      id: 'upload-1',
      deviceId: 'device-1',
      storageKey: 'uploads/test.jpg',
      url: 'http://localhost:4000/storage/uploads/test.jpg',
      mimeType: 'image/jpeg',
      fileName: 'test.jpg',
    });

    const job = await repository.createJob({
      deviceId: 'device-1',
      uploadId: 'upload-1',
      promptVersion: 'v1',
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
});
