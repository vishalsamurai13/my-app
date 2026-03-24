import AsyncStorage from '@react-native-async-storage/async-storage';

const DEVICE_ID_KEY = 'ai-clipart-device-id';

function generateId() {
  return `device_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

export async function getOrCreateDeviceId() {
  const existing = await AsyncStorage.getItem(DEVICE_ID_KEY);

  if (existing) {
    return existing;
  }

  const next = generateId();
  await AsyncStorage.setItem(DEVICE_ID_KEY, next);
  return next;
}
