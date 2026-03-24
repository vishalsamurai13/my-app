import type { StyleType } from '@ai-clipart/shared';
import type { AiProvider, GeneratedVariant } from './provider.js';

const STYLE_PROMPTS: Record<StyleType, string> = {
  cartoon: 'Convert this portrait into a vibrant cartoon clipart while preserving the identity.',
  anime: 'Convert this portrait into a polished anime clipart while preserving the identity.',
  pixel: 'Convert this portrait into a readable pixel-art clipart while preserving the identity.',
  flat: 'Convert this portrait into a clean flat-illustration clipart while preserving the identity.',
  sketch: 'Convert this portrait into a pencil-sketch clipart while preserving the identity.',
};

type ReplicatePrediction = {
  id: string;
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  output?: string | string[] | null;
  error?: string | null;
};

export class ReplicateAiProvider implements AiProvider {
  readonly name = 'replicate' as const;

  constructor(
    private readonly token: string,
    readonly model: string,
    private readonly version?: string,
    private readonly imageField = 'image',
    private readonly promptField = 'prompt',
  ) {}

  async generateStyleVariant(input: {
    style: StyleType;
    promptVersion: string;
    sourceImageUrl: string;
  }): Promise<GeneratedVariant> {
    const prompt = `${STYLE_PROMPTS[input.style]} Prompt version: ${input.promptVersion}.`;
    const prediction = await this.createPrediction({
      [this.promptField]: prompt,
      [this.imageField]: input.sourceImageUrl,
    });

    const outputUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
    if (!outputUrl) {
      throw new Error(prediction.error || 'Replicate did not return an output URL.');
    }

    const fileResponse = await fetch(outputUrl);
    if (!fileResponse.ok) {
      throw new Error(`Failed to download Replicate output: ${fileResponse.status}`);
    }

    const arrayBuffer = await fileResponse.arrayBuffer();
    const mimeType = fileResponse.headers.get('content-type') ?? 'image/png';

    return {
      buffer: Buffer.from(arrayBuffer),
      mimeType,
      width: 1024,
      height: 1024,
      providerJobId: prediction.id,
    };
  }

  private async createPrediction(modelInput: Record<string, string>) {
    const url = this.version
      ? 'https://api.replicate.com/v1/predictions'
      : `https://api.replicate.com/v1/models/${this.model}/predictions`;

    const body = this.version
      ? { version: this.version, input: modelInput }
      : { input: modelInput };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        Prefer: 'wait=60',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(`Replicate request failed: ${message}`);
    }

    const payload = (await response.json()) as ReplicatePrediction;
    if (payload.status !== 'succeeded' || !payload.output) {
      throw new Error(payload.error || `Replicate prediction ended with status: ${payload.status}`);
    }

    return payload;
  }
}
