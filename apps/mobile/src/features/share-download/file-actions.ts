import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import { Share } from 'react-native';
import * as Sharing from 'expo-sharing';

export async function saveRemoteFile(url: string, fileName: string) {
  const destination = `${FileSystem.cacheDirectory}${fileName}`;
  const download = await FileSystem.downloadAsync(url, destination);
  return download.uri;
}

export async function saveRemoteFileToGallery(url: string, fileName: string) {
  const permission = await MediaLibrary.requestPermissionsAsync();

  if (!permission.granted) {
    throw new Error('Media library permission is required to save images to your gallery.');
  }

  const uri = await saveRemoteFile(url, fileName);
  const asset = await MediaLibrary.createAssetAsync(uri);
  await MediaLibrary.createAlbumAsync('AI Clipart Generator', asset, false).catch(() => null);
  return asset;
}

export async function shareRemoteFile(url: string, fileName: string) {
  const isPublicLink =
    /^https:\/\//.test(url) &&
    !url.includes('localhost') &&
    !url.includes('127.0.0.1') &&
    !url.includes('10.0.2.2');

  if (isPublicLink) {
    await Share.share({
      message: `View this generated image: ${url}`,
      url,
      title: fileName,
    });
    return;
  }

  const uri = await saveRemoteFile(url, fileName);
  const canShare = await Sharing.isAvailableAsync();

  if (!canShare) {
    throw new Error('Sharing is not available on this device.');
  }

  await Sharing.shareAsync(uri);
}
