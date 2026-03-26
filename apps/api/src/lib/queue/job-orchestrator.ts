import { extension as mimeExtension } from 'mime-types';
import type { StyleType } from '@ai-clipart/shared';
import { AiProviderError } from '@/lib/ai/provider.js';
import type { AiProvider } from '@/lib/ai/provider.js';
import type { AppRepository } from '@/lib/prisma/repository.js';
import type { StorageProvider } from '@/lib/storage/provider.js';

export class JobOrchestrator {
  private readonly inFlight = new Set<string>();
  private readonly maxStyleAttempts = 2;

  constructor(
    private readonly repository: AppRepository,
    private readonly aiProvider: AiProvider,
    private readonly storage: StorageProvider,
  ) {}

  get providerName() {
    return this.aiProvider.name;
  }

  get modelName() {
    return this.aiProvider.model;
  }

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
        startedAt: new Date().toISOString(),
      });

      try {
        const generated = await this.generateWithRetry({
          style: style.style,
          promptVersion: job.promptVersion,
          prompt: job.prompt,
          sourceImageUrl: upload.url,
        });

        const extension = mimeExtension(generated.mimeType) || 'svg';
        const stored = await this.storage.saveAsset({
          buffer: generated.buffer,
          extension: extension.toString(),
          folder: 'generated',
          mimeType: generated.mimeType,
        });

        await this.repository.attachAsset({
          styleTaskId: style.id,
          storageKey: stored.storageKey,
          url: stored.url,
          mimeType: generated.mimeType,
          width: generated.width,
          height: generated.height,
        });
        await this.repository.updateStyleTask({
          jobId,
          style: style.style,
          status: 'success',
          providerJobId: generated.providerJobId,
          completedAt: new Date().toISOString(),
          error: null,
        });
      } catch (error) {
        await this.repository.updateStyleTask({
          jobId,
          style: style.style,
          status: 'error',
          providerJobId: null,
          error: error instanceof Error ? error.message : 'Generation failed.',
          completedAt: new Date().toISOString(),
        });
      }
    }
  }

  private async generateWithRetry(input: {
    style: StyleType;
    promptVersion: string;
    prompt?: string | null;
    sourceImageUrl: string;
  }) {
    let lastError: unknown;

    for (let attempt = 0; attempt < this.maxStyleAttempts; attempt += 1) {
      try {
        return await this.aiProvider.generateStyleVariant(input);
      } catch (error) {
        lastError = error;
        const canRetry = error instanceof AiProviderError && error.options?.retryable && attempt < this.maxStyleAttempts - 1;
        const retryAfterMs = error instanceof AiProviderError ? error.options?.retryAfterMs ?? 1_500 : 0;

        if (!canRetry) {
          throw error;
        }

        if (retryAfterMs > 0) {
          await new Promise((resolve) => setTimeout(resolve, retryAfterMs));
        }
      }
    }

    throw lastError instanceof Error ? lastError : new Error('Generation failed.');
  }
}
