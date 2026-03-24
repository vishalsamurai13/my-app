export type StoredAsset = {
  storageKey: string;
  url: string;
};

export interface StorageProvider {
  mode: 'local' | 'cloudinary';
  saveAsset(input: {
    buffer: Buffer;
    extension: string;
    folder: string;
    mimeType?: string;
  }): Promise<StoredAsset>;
  healthCheck(): Promise<boolean>;
}
