import { extension as mimeExtension } from 'mime-types';
import type { StyleType } from '@ai-clipart/shared';
import type { AiProvider } from '@/lib/ai/provider.js';
import type { AppRepository } from '@/lib/prisma/repository.js';
import { LocalStorageService } from '@/lib/storage/local-storage.js';

export class JobOrchestrator {
  private readonly inFlight = new Set<string>();

  constructor(
    private readonly repository: AppRepository,
    private readonly aiProvider: AiProvider,
    private readonly storage: LocalStorageService,
  ) {}

  enqueue(jobId: string) {
    if (this.inFlight.has(jobId)) {
      return;
    }

    this.inFlight.add(jobId);
    void this.process(jobId).finally(() => {
      this.inFlight.delete(jobId);
    });
  }

  async retry(jobId: string, style: StyleType) {
    await this.repository.resetStyleTask(jobId, style);
    this.enqueue(jobId);
  }

  private async process(jobId: string) {
    const job = await this.repository.getJob(jobId);
    if (!job) {
      return;
    }

    const upload = await this.repository.getUpload(job.uploadId);
    if (!upload) {
      return;
    }

    const pendingStyles = job.styles.filter((style) => style.status === 'queued' || style.status === 'processing');

    for (const style of pendingStyles) {
      await this.repository.updateStyleTask({
        jobId,
        style: style.style,
        status: 'processing',
      });

      try {
        const generated = await this.aiProvider.generateStyleVariant({
          style: style.style,
          promptVersion: job.promptVersion,
          sourceImageUrl: upload.url,
        });

        const extension = mimeExtension(generated.mimeType) || 'svg';
        const stored = await this.storage.saveUpload({
          buffer: generated.buffer,
          extension: extension.toString(),
          folder: 'generated',
        });

        await this.repository.attachAsset({
          styleTaskId: style.id,
          storageKey: stored.storageKey,
          url: stored.url,
          mimeType: generated.mimeType,
          width: generated.width,
          height: generated.height,
        });
      } catch (error) {
        await this.repository.updateStyleTask({
          jobId,
          style: style.style,
          status: 'error',
          error: error instanceof Error ? error.message : 'Generation failed.',
        });
      }
    }
  }
}
