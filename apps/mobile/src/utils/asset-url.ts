import { API_BASE_URL } from '@/constants/config';

export function resolveAssetUrl(url?: string | null) {
  if (!url) {
    return undefined;
  }

  try {
    const assetUrl = new URL(url);
    const apiUrl = new URL(API_BASE_URL);

    if (assetUrl.hostname === 'localhost' || assetUrl.hostname === '127.0.0.1') {
      assetUrl.protocol = apiUrl.protocol;
      assetUrl.host = apiUrl.host;
      return assetUrl.toString();
    }

    return assetUrl.toString();
  } catch {
    return url;
  }
}
