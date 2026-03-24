import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import type { GenerationJob, StyleType, StyleTaskStatus } from '@ai-clipart/shared';
import { v4 as uuid } from 'uuid';
import type { AssetRecord, RepositoryState, StyleTaskRecord, UploadRecord } from '@/types/app.js';

export interface AppRepository {
  saveUpload(input: Omit<UploadRecord, 'createdAt'>): Promise<UploadRecord>;
  createJob(input: {
    deviceId: string;
    uploadId: string;
    promptVersion: string;
    styles: StyleType[];
  }): Promise<GenerationJob>;
  getJob(jobId: string): Promise<GenerationJob | null>;
  listJobsByDevice(deviceId: string): Promise<GenerationJob[]>;
  updateStyleTask(input: {
    jobId: string;
    style: StyleType;
    status: StyleTaskStatus;
    error?: string | null;
  }): Promise<void>;
  attachAsset(input: Omit<AssetRecord, 'createdAt' | 'id'>): Promise<void>;
  resetStyleTask(jobId: string, style: StyleType): Promise<void>;
  getUpload(uploadId: string): Promise<UploadRecord | null>;
}

function now() {
  return new Date().toISOString();
}

function deriveJobStatus(tasks: StyleTaskRecord[]): StyleTaskStatus {
  if (tasks.every((task) => task.status === 'success')) {
    return 'success';
  }

  if (tasks.some((task) => task.status === 'processing')) {
    return 'processing';
  }

  if (tasks.some((task) => task.status === 'error')) {
    return 'error';
  }

  return 'queued';
}

export class FileRepository implements AppRepository {
  constructor(private readonly filePath: string) {}

  private async readState() {
    try {
      const raw = await readFile(this.filePath, 'utf8');
      return JSON.parse(raw) as RepositoryState;
    } catch {
      return {
        devices: [],
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

  async saveUpload(input: Omit<UploadRecord, 'createdAt'>) {
    const state = await this.readState();
    const created: UploadRecord = {
      ...input,
      createdAt: now(),
    };

    state.uploads.push(created);
    if (!state.devices.includes(input.deviceId)) {
      state.devices.push(input.deviceId);
    }
    await this.writeState(state);
    return created;
  }

  async createJob(input: {
    deviceId: string;
    uploadId: string;
    promptVersion: string;
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
      error: null,
      assetId: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    }));

    const job: GenerationJob = {
      id: jobId,
      deviceId: input.deviceId,
      uploadId: input.uploadId,
      createdAt: timestamp,
      updatedAt: timestamp,
      promptVersion: input.promptVersion,
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
    if (!state.devices.includes(input.deviceId)) {
      state.devices.push(input.deviceId);
    }
    await this.writeState(state);
    return job;
  }

  async getJob(jobId: string) {
    const state = await this.readState();
    const job = state.jobs.find((item) => item.id === jobId);

    if (!job) {
      return null;
    }

    return this.composeJob(state, jobId);
  }

  async listJobsByDevice(deviceId: string) {
    const state = await this.readState();
    const jobs = state.jobs.filter((job) => job.deviceId === deviceId);
    return Promise.all(jobs.map((job) => this.composeJob(state, job.id)));
  }

  async updateStyleTask(input: {
    jobId: string;
    style: StyleType;
    status: StyleTaskStatus;
    error?: string | null;
  }) {
    const state = await this.readState();
    const task = state.styleTasks.find((item) => item.jobId === input.jobId && item.style === input.style);

    if (!task) {
      return;
    }

    task.status = input.status;
    task.error = input.error ?? null;
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

    state.assets.push({
      id: assetId,
      createdAt: now(),
      ...input,
    });

    const task = state.styleTasks.find((item) => item.id === input.styleTaskId);

    if (task) {
      task.assetId = assetId;
      task.status = 'success';
      task.error = null;
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
    return this.updateStyleTask({
      jobId,
      style,
      status: 'queued',
      error: null,
    });
  }

  async getUpload(uploadId: string) {
    const state = await this.readState();
    return state.uploads.find((upload) => upload.id === uploadId) ?? null;
  }

  private async composeJob(state: RepositoryState, jobId: string): Promise<GenerationJob> {
    const job = state.jobs.find((item) => item.id === jobId);

    if (!job) {
      throw new Error('Job not found.');
    }

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

export function createRepository() {
  return new FileRepository(join(process.cwd(), 'data', 'repository.json'));
}
