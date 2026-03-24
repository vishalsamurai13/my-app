import type { StyleType } from '@ai-clipart/shared';
import type { AiProviderName } from '@/types/app.js';

export type GeneratedVariant = {
  buffer: Buffer;
  mimeType: string;
  width: number;
  height: number;
  providerJobId?: string;
};

export interface AiProvider {
  name: AiProviderName;
  model: string;
  generateStyleVariant(input: {
    style: StyleType;
    promptVersion: string;
    sourceImageUrl: string;
  }): Promise<GeneratedVariant>;
}
