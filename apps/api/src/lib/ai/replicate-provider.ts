import type { StyleType } from '@ai-clipart/shared';
import { AiProviderError, type AiProvider, type GeneratedVariant } from './provider.js';

const STYLE_PROMPTS: Record<StyleType, string> = {
  cartoon:
    'Transform this portrait into a premium cartoon character illustration. Preserve the subject identity, face shape, hairstyle, skin tone, and expression. Use clean crisp outlines, smooth cel shading, soft depth, vibrant balanced colors, simplified polished forms, centered composition, and a neat studio background. The result should feel like a modern app-ready cartoon avatar, highly readable, refined, and professional.',
  anime:
    'Transform this portrait into a high-end anime character portrait. Preserve the person identity, facial structure, hairstyle, and emotional expression. Use elegant line work, luminous eyes, soft skin rendering, stylized anime proportions, tasteful highlights, rich but controlled colors, and a cinematic portrait composition. Keep the image polished, beautiful, and premium, like official anime key art.',
  illustration:
    'Transform this portrait into a clean editorial digital illustration. Preserve the core identity and recognizable facial features. Use simplified yet sophisticated shapes, smooth vector-like rendering, subtle depth, modern color harmony, soft gradients, crisp edges, and a minimal art-directed background. The image should feel premium, contemporary, and suitable for a design-forward brand campaign.',
  pixel:
    'Transform this portrait into a high-quality pixel art character portrait. Preserve the subject identity and silhouette while simplifying details into readable pixel clusters. Use deliberate retro game styling, limited but rich color palettes, sharp pixel edges, clean shading, strong contrast, and iconic facial readability. The result should look handcrafted, authentic, and visually coherent, not blurry or noisy.',
  sketch:
    'Transform this portrait into a refined pencil sketch illustration. Preserve the subject identity, face proportions, and expression. Use elegant graphite linework, layered hatching, subtle cross-hatching, soft paper texture, tonal contrast, and hand-drawn detail around the eyes, nose, and hair. Keep the composition clean and artistic, with a premium concept-art sketchbook feel.',
  fantasy:
    'Transform this portrait into a cinematic fantasy character artwork. Preserve the subject identity while elevating the styling into an epic magical world. Use dramatic atmosphere, painterly lighting, mystical color accents, rich textures, subtle environmental storytelling, and a majestic portrait composition. The result should feel immersive, premium, and heroic, like key art from a fantasy game or film.',
  comic:
    'Transform this portrait into a dynamic comic-book hero illustration. Preserve the subject identity and expression while exaggerating the energy and attitude of the pose. Use bold inks, graphic shadows, striking contrast, dramatic lighting, vivid saturated colors, confident line art, and a polished panel-ready composition. The final image should feel powerful, stylish, and professionally illustrated.',
  watercolor:
    'Transform this portrait into an elegant watercolor painting. Preserve the subject identity, facial proportions, and expression while using soft pigment blooms, layered washes, delicate brush edges, subtle paper texture, graceful color transitions, and an airy artistic composition. The result should feel handcrafted, luminous, premium, and gallery-worthy.',
};

type ReplicatePrediction = {
  id: string;
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  output?: string | string[] | null;
  error?: string | null;
};

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseRetryAfterMs(message: string) {
  const fromJson = message.match(/"retry_after":\s*(\d+)/i);
  if (fromJson) {
    return Number(fromJson[1]) * 1000;
  }

  const fromText = message.match(/resets in ~?(\d+)s/i);
  if (fromText) {
    return Number(fromText[1]) * 1000;
  }

  return undefined;
}

function formatThrottleMessage(message: string) {
  const retryAfterMs = parseRetryAfterMs(message);
  const seconds = retryAfterMs ? Math.max(1, Math.ceil(retryAfterMs / 1000)) : null;
  return seconds
    ? `Replicate is rate limiting requests right now. Try this style again in about ${seconds} seconds.`
    : 'Replicate is rate limiting requests right now. Try this style again shortly.';
}

function formatPredictionError(message: string) {
  if (/unexpected error handling prediction/i.test(message)) {
    return 'Replicate hit a temporary prediction error for this style. Please retry it.';
  }

  return message;
}

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
    prompt?: string | null;
    sourceImageUrl: string;
  }): Promise<GeneratedVariant> {
    const prompt = `${STYLE_PROMPTS[input.style]}${input.prompt ? ` Additional guidance: ${input.prompt}.` : ''} Prompt version: ${input.promptVersion}.`;
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

    for (let attempt = 0; attempt < 2; attempt += 1) {
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

        if (response.status === 429) {
          const retryAfterMs = parseRetryAfterMs(message) ?? 8_000;
          if (attempt === 0) {
            await wait(retryAfterMs);
            continue;
          }

          throw new AiProviderError(formatThrottleMessage(message), {
            retryable: true,
            retryAfterMs,
            code: 'replicate_throttled',
          });
        }

        throw new AiProviderError(`Replicate request failed: ${message}`, {
          retryable: response.status >= 500,
          code: 'replicate_request_failed',
        });
      }

      const payload = (await response.json()) as ReplicatePrediction;
      if (payload.status === 'succeeded' && payload.output) {
        return payload;
      }

      const predictionMessage = payload.error || `Replicate prediction ended with status: ${payload.status}`;
      throw new AiProviderError(formatPredictionError(predictionMessage), {
        retryable:
          payload.status === 'starting' ||
          payload.status === 'processing' ||
          /unexpected error handling prediction/i.test(predictionMessage),
        code: 'replicate_prediction_failed',
      });
    }

    throw new AiProviderError('Replicate prediction did not complete successfully.', {
      retryable: true,
      code: 'replicate_prediction_incomplete',
    });
  }
}
