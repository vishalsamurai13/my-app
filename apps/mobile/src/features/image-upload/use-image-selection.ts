import { useRouter } from 'expo-router';
import { useState } from 'react';
import { pickImage } from './image-picker';
import { useAppStore } from '@/lib/store/app-store';

export function useImageSelection() {
  const router = useRouter();
  const setSelectedImage = useAppStore((state) => state.setSelectedImage);
  const [isPicking, setIsPicking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePick(source: 'camera' | 'gallery') {
    setIsPicking(true);
    setError(null);

    try {
      const image = await pickImage(source);

      if (!image) {
        return;
      }

      setSelectedImage(image);
      router.push('/preview');
    } catch (pickError) {
      setError(pickError instanceof Error ? pickError.message : 'Unable to select image.');
    } finally {
      setIsPicking(false);
    }
  }

  return {
    error,
    isPicking,
    handlePick,
  };
}
