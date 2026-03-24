import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

export async function saveRemoteFile(url: string, fileName: string) {
  const destination = `${FileSystem.cacheDirectory}${fileName}`;
  const download = await FileSystem.downloadAsync(url, destination);
  return download.uri;
}

export async function shareRemoteFile(url: string, fileName: string) {
  const uri = await saveRemoteFile(url, fileName);
  const canShare = await Sharing.isAvailableAsync();

  if (!canShare) {
    throw new Error('Sharing is not available on this device.');
  }

  await Sharing.shareAsync(uri);
}
