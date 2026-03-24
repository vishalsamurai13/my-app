import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { v4 as uuid } from 'uuid';

export class LocalStorageService {
  constructor(
    private readonly publicBaseUrl: string,
    private readonly storageRoot: string,
  ) {}

  async saveUpload(input: { buffer: Buffer; extension: string; folder: string }) {
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
}
