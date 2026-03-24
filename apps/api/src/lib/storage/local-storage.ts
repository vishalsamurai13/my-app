import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { v4 as uuid } from 'uuid';
import type { StorageProvider } from './provider.js';

export class LocalStorageService implements StorageProvider {
  readonly mode = 'local' as const;

  constructor(
    private readonly publicBaseUrl: string,
    private readonly storageRoot: string,
  ) {}

  async saveAsset(input: { buffer: Buffer; extension: string; folder: string }) {
    await mkdir(join(this.storageRoot, input.folder), { recursive: true });

    const fileName = `${uuid()}.${input.extension}`;
    const storageKey = join(input.folder, fileName);
    const absolutePath = join(this.storageRoot, storageKey);

    await writeFile(absolutePath, input.buffer);

    return {
      storageKey,
      url: `${this.publicBaseUrl}/storage/${storageKey.replaceAll('\\', '/')}`,
    };
  }

  async healthCheck() {
    return true;
  }
}
