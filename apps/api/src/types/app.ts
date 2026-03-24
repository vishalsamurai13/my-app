import type { GenerationJob, StyleType, StyleTaskStatus } from '@ai-clipart/shared';

export type UploadRecord = {
  id: string;
  deviceId: string;
  storageKey: string;
  url: string;
  mimeType: string;
  fileName: string;
  createdAt: string;
};

export type StyleTaskRecord = {
  id: string;
  jobId: string;
  style: StyleType;
  status: StyleTaskStatus;
  error?: string | null;
  assetId?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AssetRecord = {
  id: string;
  styleTaskId: string;
  url: string;
  storageKey: string;
  mimeType: string;
  width?: number;
  height?: number;
  createdAt: string;
};

export type RepositoryState = {
  devices: string[];
  uploads: UploadRecord[];
  jobs: GenerationJob[];
  styleTasks: StyleTaskRecord[];
  assets: AssetRecord[];
};
