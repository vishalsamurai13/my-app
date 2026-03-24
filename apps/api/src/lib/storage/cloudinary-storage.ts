import { createHash } from 'node:crypto';
import type { StorageProvider } from './provider.js';

export class CloudinaryStorageService implements StorageProvider {
  readonly mode = 'cloudinary' as const;

  constructor(
    private readonly cloudName: string,
    private readonly apiKey: string,
    private readonly apiSecret: string,
    private readonly folder: string,
  ) {}

  async saveAsset(input: {
    buffer: Buffer;
    extension: string;
    folder: string;
    mimeType?: string;
  }) {
    const timestamp = Math.floor(Date.now() / 1000);
    const targetFolder = `${this.folder}/${input.folder}`;
    const signatureBase = `folder=${targetFolder}&timestamp=${timestamp}${this.apiSecret}`;
    const signature = createHash('sha1').update(signatureBase).digest('hex');

    const form = new FormData();
    const body = new Uint8Array(input.buffer);
    form.append('file', new Blob([body], { type: input.mimeType ?? 'application/octet-stream' }), `asset.${input.extension}`);
    form.append('api_key', this.apiKey);
    form.append('timestamp', String(timestamp));
    form.append('folder', targetFolder);
    form.append('signature', signature);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`, {
      method: 'POST',
      body: form,
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(`Cloudinary upload failed: ${message}`);
    }

    const payload = (await response.json()) as {
      secure_url: string;
      public_id: string;
    };

    return {
      storageKey: payload.public_id,
      url: payload.secure_url,
    };
  }

  async healthCheck() {
    return Boolean(this.cloudName && this.apiKey && this.apiSecret);
  }
}
