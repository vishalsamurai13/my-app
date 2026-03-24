import type { StyleType } from '@ai-clipart/shared';

export type GeneratedVariant = {
  buffer: Buffer;
  mimeType: string;
  width: number;
  height: number;
};

export interface AiProvider {
  generateStyleVariant(input: {
    style: StyleType;
    promptVersion: string;
    sourceImageUrl: string;
  }): Promise<GeneratedVariant>;
}
