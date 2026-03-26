import { STYLE_LABELS, type StyleType } from '@ai-clipart/shared';
import type { AiProvider, GeneratedVariant } from './provider.js';

const STYLE_COLORS: Record<StyleType, string> = {
  cartoon: '#ff8744',
  anime: '#ff5d8f',
  illustration: '#7b61ff',
  pixel: '#4e7aff',
  sketch: '#54483d',
  fantasy: '#7e3af2',
  comic: '#f59e0b',
  watercolor: '#38bdf8',
};

export class MockAiProvider implements AiProvider {
  readonly name = 'mock' as const;
  readonly model = 'local-svg-mock';

  async generateStyleVariant(input: {
    style: StyleType;
    promptVersion: string;
    prompt?: string | null;
    sourceImageUrl: string;
  }): Promise<GeneratedVariant> {
    const color = STYLE_COLORS[input.style];
    const label = STYLE_LABELS[input.style];
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
        <rect width="1024" height="1024" fill="#f5f0e8" />
        <rect x="48" y="48" width="928" height="928" rx="72" fill="${color}" opacity="0.12" />
        <circle cx="512" cy="390" r="180" fill="${color}" opacity="0.25" />
        <rect x="284" y="590" width="456" height="232" rx="116" fill="${color}" opacity="0.35" />
        <text x="512" y="210" font-size="58" text-anchor="middle" font-family="Arial" fill="#101418">AI Clipart Generator</text>
        <text x="512" y="904" font-size="86" font-weight="700" text-anchor="middle" font-family="Arial" fill="#101418">${label}</text>
        <text x="512" y="962" font-size="28" text-anchor="middle" font-family="Arial" fill="#54483d">${(input.prompt || input.promptVersion).slice(0, 48)}</text>
      </svg>
    `;

    return {
      buffer: Buffer.from(svg),
      mimeType: 'image/svg+xml',
      width: 1024,
      height: 1024,
    };
  }
}
