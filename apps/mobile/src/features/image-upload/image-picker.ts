import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { MAX_IMAGE_SIZE_BYTES } from '@/constants/config';

async function requestPermission(source: 'camera' | 'gallery') {
  if (source === 'camera') {
    const result = await ImagePicker.requestCameraPermissionsAsync();
    return result.granted;
  }

  const result = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return result.granted;
}

async function optimizeImage(asset: ImagePicker.ImagePickerAsset) {
  const manipulateResult =
    asset.fileSize && asset.fileSize > MAX_IMAGE_SIZE_BYTES
      ? await ImageManipulator.manipulateAsync(asset.uri, [], {
          compress: 0.72,
          format: ImageManipulator.SaveFormat.JPEG,
        })
      : { uri: asset.uri };

  return {
    uri: manipulateResult.uri,
    mimeType: asset.mimeType ?? 'image/jpeg',
    fileName: asset.fileName ?? `clipart-${Date.now()}.jpg`,
    fileSize: asset.fileSize,
  };
}

export async function pickImage(source: 'camera' | 'gallery') {
  const granted = await requestPermission(source);

  if (!granted) {
    throw new Error(`Permission denied for ${source}.`);
  }

  const result =
    source === 'camera'
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          quality: 1,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          quality: 1,
        });

  if (result.canceled || result.assets.length === 0) {
    return null;
  }

  return optimizeImage(result.assets[0]);
}
