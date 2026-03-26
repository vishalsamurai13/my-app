import type { GenerationJob, StyleType, StyleTaskStatus } from '@ai-clipart/shared';

export type AiProviderName = 'mock' | 'replicate';

export type AuthUser = {
  clerkUserId: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
};

export type UploadRecord = {
  id: string;
  userId: string;
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
  providerJobId?: string | null;
  error?: string | null;
  assetId?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
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
  users: AuthUser[];
  uploads: UploadRecord[];
  jobs: GenerationJob[];
  styleTasks: StyleTaskRecord[];
  assets: AssetRecord[];
};

export type AppHealth = {
  ok: true;
  service: 'ai-clipart-api';
  provider: AiProviderName;
  storage: 'local' | 'cloudinary';
  repository: 'file' | 'prisma';
  databaseConfigured: boolean;
  storageConfigured: boolean;
};
