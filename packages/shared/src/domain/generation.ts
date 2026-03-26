import { STYLE_TYPES } from '../constants/styles';

export type StyleType = (typeof STYLE_TYPES)[number];
export const SHAPE_TYPES = ['square', 'landscape', 'portrait', 'custom'] as const;
export type ShapeType = (typeof SHAPE_TYPES)[number];

export const STYLE_TASK_STATUSES = ['queued', 'processing', 'success', 'error'] as const;
export type StyleTaskStatus = (typeof STYLE_TASK_STATUSES)[number];

export type GeneratedAsset = {
  id: string;
  assetId?: string;
  style: StyleType;
  status: StyleTaskStatus;
  mimeType?: string;
  width?: number;
  height?: number;
  url?: string;
  storageKey?: string;
  error?: string | null;
};

export type GenerationJob = {
  id: string;
  userId: string;
  uploadId: string;
  createdAt: string;
  updatedAt: string;
  promptVersion: string;
  prompt: string | null;
  shape: ShapeType | null;
  provider?: string;
  model?: string;
  status: StyleTaskStatus;
  styles: GeneratedAsset[];
};
