import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { createJob, uploadImage } from '@/lib/api/client';
import { useAppStore } from '@/lib/store/app-store';

export function useCreateJob() {
  const router = useRouter();
  const deviceId = useAppStore((state) => state.deviceId);
  const selectedImage = useAppStore((state) => state.selectedImage);
  const selectedStyles = useAppStore((state) => state.selectedStyles);

  return useMutation({
    mutationFn: async () => {
      if (!deviceId || !selectedImage) {
        throw new Error('Image or device identity is missing.');
      }

      const upload = await uploadImage({
        uri: selectedImage.uri,
        fileName: selectedImage.fileName,
        mimeType: selectedImage.mimeType,
        deviceId,
      });

      return createJob({
        uploadId: upload.uploadId,
        styles: selectedStyles,
        deviceId,
      });
    },
    onSuccess: ({ jobId }) => {
      router.replace(`/results/${jobId}`);
    },
  });
}
