import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { AiProvider as PrismaAiProvider, PrismaClient } from '@prisma/client';
import type { GenerationJob, ShapeType, StyleType, StyleTaskStatus } from '@ai-clipart/shared';
import { v4 as uuid } from 'uuid';
import type { AiProviderName, AssetRecord, AuthUser, RepositoryState, StyleTaskRecord, UploadRecord } from '@/types/app.js';

export type UserProfile = {
  id: string;
  clerkUserId: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
};

export interface AppRepository {
  readonly mode: 'file' | 'prisma';
  upsertUser(input: AuthUser): Promise<UserProfile>;
  getUserByClerkId(clerkUserId: string): Promise<UserProfile | null>;
  saveUpload(input: Omit<UploadRecord, 'createdAt'>): Promise<UploadRecord>;
  createJob(input: {
    userId: string;
    uploadId: string;
    promptVersion: string;
    prompt?: string;
    shape?: ShapeType;
    provider: AiProviderName;
    model: string;
    styles: StyleType[];
  }): Promise<GenerationJob>;
  getJob(jobId: string): Promise<GenerationJob | null>;
  getJobForUser(jobId: string, userId: string): Promise<GenerationJob | null>;
  listJobsByUser(userId: string): Promise<GenerationJob[]>;
  updateStyleTask(input: {
    jobId: string;
    style: StyleType;
    status: StyleTaskStatus;
    error?: string | null;
    providerJobId?: string | null;
    startedAt?: string | null;
    completedAt?: string | null;
  }): Promise<void>;
  attachAsset(input: Omit<AssetRecord, 'createdAt' | 'id'>): Promise<void>;
  resetStyleTask(jobId: string, style: StyleType): Promise<void>;
  getUpload(uploadId: string): Promise<UploadRecord | null>;
  getUploadForUser(uploadId: string, userId: string): Promise<UploadRecord | null>;
  healthCheck(): Promise<boolean>;
}

function now() {
  return new Date().toISOString();
}

function deriveJobStatus(tasks: StyleTaskRecord[]): StyleTaskStatus {
  if (tasks.every((task) => task.status === 'success')) return 'success';
  if (tasks.some((task) => task.status === 'processing')) return 'processing';
  if (tasks.some((task) => task.status === 'error')) return 'error';
  return 'queued';
}

function normalizeLegacyStyle(style: string) {
  return style === 'flat' ? 'illustration' : style;
}

function mapProvider(provider: AiProviderName) {
  return provider === 'replicate' ? PrismaAiProvider.replicate : PrismaAiProvider.mock;
}

function mapUserProfile(input: AuthUser): UserProfile {
  return {
    id: input.clerkUserId,
    clerkUserId: input.clerkUserId,
    email: input.email,
    firstName: input.firstName,
    lastName: input.lastName,
    imageUrl: input.imageUrl,
  };
}

export class FileRepository implements AppRepository {
  readonly mode = 'file' as const;

  constructor(private readonly filePath: string) {}

  private async readState() {
    try {
      const raw = await readFile(this.filePath, 'utf8');
      const parsed = JSON.parse(raw) as Partial<RepositoryState>;
      return {
        users: parsed.users ?? [],
        uploads: (parsed.uploads ?? []).map((upload) => ({
          ...upload,
          userId: upload.userId ?? (upload as UploadRecord & { deviceId?: string }).deviceId ?? 'legacy-user',
        })),
        jobs: (parsed.jobs ?? []).map((job) => ({
          ...job,
          userId: job.userId ?? (job as GenerationJob & { deviceId?: string }).deviceId ?? 'legacy-user',
          prompt: job.prompt ?? null,
          shape: job.shape ?? null,
          styles: job.styles.map((style) => ({
            ...style,
            style: normalizeLegacyStyle(style.style) as StyleType,
          })),
        })),
        styleTasks: (parsed.styleTasks ?? []).map((task) => ({
          ...task,
          style: normalizeLegacyStyle(task.style) as StyleType,
        })),
        assets: parsed.assets ?? [],
      } satisfies RepositoryState;
    } catch {
      return {
        users: [],
        uploads: [],
        jobs: [],
        styleTasks: [],
        assets: [],
      } satisfies RepositoryState;
    }
  }

  private async writeState(state: RepositoryState) {
    await mkdir(dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, JSON.stringify(state, null, 2));
  }

  async upsertUser(input: AuthUser) {
    const state = await this.readState();
    const index = state.users.findIndex((item) => item.clerkUserId === input.clerkUserId);
    if (index >= 0) {
      state.users[index] = input;
    } else {
      state.users.push(input);
    }
    await this.writeState(state);
    return mapUserProfile(input);
  }

  async getUserByClerkId(clerkUserId: string) {
    const state = await this.readState();
    const user = state.users.find((item) => item.clerkUserId === clerkUserId);
    return user ? mapUserProfile(user) : null;
  }

  async saveUpload(input: Omit<UploadRecord, 'createdAt'>) {
    const state = await this.readState();
    const created: UploadRecord = { ...input, createdAt: now() };
    state.uploads.push(created);
    await this.writeState(state);
    return created;
  }

  async createJob(input: {
    userId: string;
    uploadId: string;
    promptVersion: string;
    prompt?: string;
    shape?: ShapeType;
    provider: AiProviderName;
    model: string;
    styles: StyleType[];
  }) {
    const state = await this.readState();
    const timestamp = now();
    const jobId = uuid();
    const styleTasks: StyleTaskRecord[] = input.styles.map((style) => ({
      id: uuid(),
      jobId,
      style,
      status: 'queued',
      providerJobId: null,
      error: null,
      assetId: null,
      startedAt: null,
      completedAt: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    }));

    const job: GenerationJob = {
      id: jobId,
      userId: input.userId,
      uploadId: input.uploadId,
      createdAt: timestamp,
      updatedAt: timestamp,
      promptVersion: input.promptVersion,
      prompt: input.prompt ?? null,
      shape: input.shape ?? null,
      provider: input.provider,
      model: input.model,
      status: 'queued',
      styles: styleTasks.map((task) => ({
        id: task.id,
        style: task.style,
        status: task.status,
        error: task.error,
      })),
    };

    state.jobs.push(job);
    state.styleTasks.push(...styleTasks);
    await this.writeState(state);
    return job;
  }

  async getJob(jobId: string) {
    const state = await this.readState();
    const job = state.jobs.find((item) => item.id === jobId);
    if (!job) return null;
    return this.composeJob(state, jobId);
  }

  async getJobForUser(jobId: string, userId: string) {
    const job = await this.getJob(jobId);
    return job?.userId === userId ? job : null;
  }

  async listJobsByUser(userId: string) {
    const state = await this.readState();
    const jobs = state.jobs.filter((job) => job.userId === userId);
    return Promise.all(jobs.map((job) => this.composeJob(state, job.id)));
  }

  async updateStyleTask(input: {
    jobId: string;
    style: StyleType;
    status: StyleTaskStatus;
    error?: string | null;
    providerJobId?: string | null;
    startedAt?: string | null;
    completedAt?: string | null;
  }) {
    const state = await this.readState();
    const task = state.styleTasks.find((item) => item.jobId === input.jobId && item.style === input.style);
    if (!task) return;

    task.status = input.status;
    task.error = input.error ?? task.error ?? null;
    task.providerJobId = input.providerJobId ?? task.providerJobId ?? null;
    task.startedAt = input.startedAt ?? task.startedAt ?? null;
    task.completedAt = input.completedAt ?? task.completedAt ?? null;
    task.updatedAt = now();

    const tasks = state.styleTasks.filter((item) => item.jobId === input.jobId);
    const job = state.jobs.find((item) => item.id === input.jobId);
    if (job) {
      job.status = deriveJobStatus(tasks);
      job.updatedAt = now();
    }

    await this.writeState(state);
  }

  async attachAsset(input: Omit<AssetRecord, 'createdAt' | 'id'>) {
    const state = await this.readState();
    const assetId = uuid();
    state.assets.push({ id: assetId, createdAt: now(), ...input });
    const task = state.styleTasks.find((item) => item.id === input.styleTaskId);
    if (task) {
      task.assetId = assetId;
      task.status = 'success';
      task.error = null;
      task.completedAt = now();
      task.updatedAt = now();
    }
    const job = state.jobs.find((item) => item.id === task?.jobId);
    const tasks = state.styleTasks.filter((item) => item.jobId === task?.jobId);
    if (job) {
      job.status = deriveJobStatus(tasks);
      job.updatedAt = now();
    }
    await this.writeState(state);
  }

  async resetStyleTask(jobId: string, style: StyleType) {
    await this.updateStyleTask({
      jobId,
      style,
      status: 'queued',
      error: null,
      providerJobId: null,
      startedAt: null,
      completedAt: null,
    });
  }

  async getUpload(uploadId: string) {
    const state = await this.readState();
    return state.uploads.find((upload) => upload.id === uploadId) ?? null;
  }

  async getUploadForUser(uploadId: string, userId: string) {
    const upload = await this.getUpload(uploadId);
    return upload?.userId === userId ? upload : null;
  }

  async healthCheck() {
    return true;
  }

  private async composeJob(state: RepositoryState, jobId: string): Promise<GenerationJob> {
    const job = state.jobs.find((item) => item.id === jobId);
    if (!job) throw new Error('Job not found.');
    const tasks = state.styleTasks.filter((item) => item.jobId === jobId);

    return {
      ...job,
      styles: tasks.map((task) => {
        const asset = task.assetId ? state.assets.find((item) => item.id === task.assetId) : undefined;
        return {
          id: task.id,
          style: task.style,
          status: task.status,
          error: task.error ?? null,
          url: asset?.url,
          storageKey: asset?.storageKey,
          mimeType: asset?.mimeType,
          width: asset?.width,
          height: asset?.height,
        };
      }),
    };
  }
}

export class PrismaRepository implements AppRepository {
  readonly mode = 'prisma' as const;

  constructor(private readonly prisma: PrismaClient) {}

  async upsertUser(input: AuthUser) {
    const user = await this.prisma.user.upsert({
      where: { clerkUserId: input.clerkUserId },
      update: {
        email: input.email ?? undefined,
        firstName: input.firstName ?? undefined,
        lastName: input.lastName ?? undefined,
        imageUrl: input.imageUrl ?? undefined,
      },
      create: {
        id: uuid(),
        clerkUserId: input.clerkUserId,
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        imageUrl: input.imageUrl,
      },
    });

    return {
      id: user.id,
      clerkUserId: user.clerkUserId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      imageUrl: user.imageUrl,
    };
  }

  async getUserByClerkId(clerkUserId: string) {
    const user = await this.prisma.user.findUnique({ where: { clerkUserId } });
    return user
      ? {
          id: user.id,
          clerkUserId: user.clerkUserId,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          imageUrl: user.imageUrl,
        }
      : null;
  }

  async saveUpload(input: Omit<UploadRecord, 'createdAt'>) {
    const upload = await this.prisma.upload.create({
      data: {
        id: input.id,
        user: { connect: { id: input.userId } },
        storageKey: input.storageKey,
        url: input.url,
        mimeType: input.mimeType,
        fileName: input.fileName,
      },
    });

    return {
      id: upload.id,
      userId: upload.userId,
      storageKey: upload.storageKey,
      url: upload.url,
      mimeType: upload.mimeType,
      fileName: upload.fileName,
      createdAt: upload.createdAt.toISOString(),
    };
  }

  async createJob(input: {
    userId: string;
    uploadId: string;
    promptVersion: string;
    prompt?: string;
    shape?: ShapeType;
    provider: AiProviderName;
    model: string;
    styles: StyleType[];
  }) {
    const created = await this.prisma.generationJob.create({
      data: {
        id: uuid(),
        promptVersion: input.promptVersion,
        prompt: input.prompt,
        shape: input.shape,
        provider: mapProvider(input.provider),
        model: input.model,
        status: 'queued',
        user: { connect: { id: input.userId } },
        upload: { connect: { id: input.uploadId } },
        styleTasks: {
          create: input.styles.map((style) => ({
            id: uuid(),
            style,
            status: 'queued',
          })),
        },
      },
    });

    return (await this.getJob(created.id))!;
  }

  async getJob(jobId: string) {
    const job = await this.prisma.generationJob.findUnique({
      where: { id: jobId },
      include: { styleTasks: { include: { asset: true } } },
    });
    return job ? this.mapJob(job) : null;
  }

  async getJobForUser(jobId: string, userId: string) {
    const job = await this.prisma.generationJob.findFirst({
      where: { id: jobId, userId },
      include: { styleTasks: { include: { asset: true } } },
    });
    return job ? this.mapJob(job) : null;
  }

  async listJobsByUser(userId: string) {
    const jobs = await this.prisma.generationJob.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { styleTasks: { include: { asset: true } } },
    });
    return jobs.map((job) => this.mapJob(job));
  }

  async updateStyleTask(input: {
    jobId: string;
    style: StyleType;
    status: StyleTaskStatus;
    error?: string | null;
    providerJobId?: string | null;
    startedAt?: string | null;
    completedAt?: string | null;
  }) {
    await this.prisma.styleTask.update({
      where: { jobId_style: { jobId: input.jobId, style: input.style } },
      data: {
        status: input.status,
        error: input.error ?? undefined,
        providerJobId: input.providerJobId ?? undefined,
        startedAt: input.startedAt ? new Date(input.startedAt) : undefined,
        completedAt: input.completedAt ? new Date(input.completedAt) : undefined,
      },
    });

    await this.recomputeJobStatus(input.jobId);
  }

  async attachAsset(input: Omit<AssetRecord, 'createdAt' | 'id'>) {
    const task = await this.prisma.styleTask.findUnique({ where: { id: input.styleTaskId } });
    if (!task) return;

    await this.prisma.asset.upsert({
      where: { styleTaskId: input.styleTaskId },
      update: {
        url: input.url,
        storageKey: input.storageKey,
        mimeType: input.mimeType,
        width: input.width,
        height: input.height,
      },
      create: {
        id: uuid(),
        styleTaskId: input.styleTaskId,
        url: input.url,
        storageKey: input.storageKey,
        mimeType: input.mimeType,
        width: input.width,
        height: input.height,
      },
    });

    await this.prisma.styleTask.update({
      where: { id: input.styleTaskId },
      data: {
        status: 'success',
        error: null,
        completedAt: new Date(),
      },
    });

    await this.recomputeJobStatus(task.jobId);
  }

  async resetStyleTask(jobId: string, style: StyleType) {
    await this.prisma.styleTask.update({
      where: { jobId_style: { jobId, style } },
      data: {
        status: 'queued',
        error: null,
        providerJobId: null,
        startedAt: null,
        completedAt: null,
      },
    });
    await this.recomputeJobStatus(jobId);
  }

  async getUpload(uploadId: string) {
    const upload = await this.prisma.upload.findUnique({ where: { id: uploadId } });
    return upload
      ? {
          id: upload.id,
          userId: upload.userId,
          storageKey: upload.storageKey,
          url: upload.url,
          mimeType: upload.mimeType,
          fileName: upload.fileName,
          createdAt: upload.createdAt.toISOString(),
        }
      : null;
  }

  async getUploadForUser(uploadId: string, userId: string) {
    const upload = await this.prisma.upload.findFirst({ where: { id: uploadId, userId } });
    return upload
      ? {
          id: upload.id,
          userId: upload.userId,
          storageKey: upload.storageKey,
          url: upload.url,
          mimeType: upload.mimeType,
          fileName: upload.fileName,
          createdAt: upload.createdAt.toISOString(),
        }
      : null;
  }

  async healthCheck() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }

  private async recomputeJobStatus(jobId: string) {
    const tasks = await this.prisma.styleTask.findMany({ where: { jobId } });
    const normalizedTasks: StyleTaskRecord[] = tasks.map((task) => ({
      id: task.id,
      jobId: task.jobId,
      style: task.style as StyleType,
      status: task.status as StyleTaskStatus,
      providerJobId: task.providerJobId,
      error: task.error,
      assetId: null,
      startedAt: task.startedAt?.toISOString() ?? null,
      completedAt: task.completedAt?.toISOString() ?? null,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
    }));

    await this.prisma.generationJob.update({
      where: { id: jobId },
      data: { status: deriveJobStatus(normalizedTasks) },
    });
  }

  private mapJob(job: {
    id: string;
    userId: string;
    uploadId: string;
    createdAt: Date;
    updatedAt: Date;
    promptVersion: string;
    prompt: string | null;
    shape: string | null;
    provider: PrismaAiProvider;
    model: string;
    status: string;
    styleTasks: Array<{
      id: string;
      style: string;
      status: string;
      error: string | null;
      asset: {
        id: string;
        url: string;
        storageKey: string;
        mimeType: string;
        width: number | null;
        height: number | null;
      } | null;
    }>;
  }): GenerationJob {
    return {
      id: job.id,
      userId: job.userId,
      uploadId: job.uploadId,
      createdAt: job.createdAt.toISOString(),
      updatedAt: job.updatedAt.toISOString(),
      promptVersion: job.promptVersion,
      prompt: job.prompt,
      shape: (job.shape as ShapeType | null) ?? null,
      provider: job.provider,
      model: job.model,
      status: job.status as StyleTaskStatus,
      styles: job.styleTasks.map((task) => ({
        id: task.id,
        style: task.style as StyleType,
        status: task.status as StyleTaskStatus,
        error: task.error,
        url: task.asset?.url,
        storageKey: task.asset?.storageKey,
        mimeType: task.asset?.mimeType,
        width: task.asset?.width ?? undefined,
        height: task.asset?.height ?? undefined,
      })),
    };
  }
}

export function createRepository(mode: 'file' | 'prisma', databaseUrl?: string) {
  if (mode === 'prisma' && databaseUrl) {
    return new PrismaRepository(new PrismaClient({ datasourceUrl: databaseUrl }));
  }

  return new FileRepository(join(process.cwd(), 'data', 'repository.json'));
}
