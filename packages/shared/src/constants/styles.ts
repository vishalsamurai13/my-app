export const STYLE_TYPES = ['cartoon', 'anime', 'illustration', 'pixel', 'sketch', 'fantasy', 'comic', 'watercolor'] as const;

export const STYLE_LABELS: Record<(typeof STYLE_TYPES)[number], string> = {
  cartoon: 'Cartoon',
  anime: 'Anime',
  illustration: 'Illustration',
  pixel: 'Pixel',
  sketch: 'Sketch',
  fantasy: 'Fantasy',
  comic: 'Comic',
  watercolor: 'Watercolor',
};
