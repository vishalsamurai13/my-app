export const STYLE_TYPES = ['cartoon', 'anime', 'pixel', 'flat', 'sketch'] as const;

export const STYLE_LABELS: Record<(typeof STYLE_TYPES)[number], string> = {
  cartoon: 'Cartoon',
  anime: 'Anime',
  pixel: 'Pixel',
  flat: 'Flat',
  sketch: 'Sketch',
};
