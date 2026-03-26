import type { StyleType } from '@ai-clipart/shared';
import type { AiProviderName } from '@/types/app.js';

export type GeneratedVariant = {
  buffer: Buffer;
  mimeType: string;
  width: number;
  height: number;
  providerJobId?: string;
};

export class AiProviderError extends Error {
  constructor(
    message: string,
    readonly options?: {
      retryable?: boolean;
      retryAfterMs?: number;
      code?: string;
    },
  ) {
    super(message);
    this.name = 'AiProviderError';
  }
}

export interface AiProvider {
  name: AiProviderName;
  model: string;
  generateStyleVariant(input: {
    style: StyleType;
    promptVersion: string;
    prompt?: string | null;
    sourceImageUrl: string;
  }): Promise<GeneratedVariant>;
}
