import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { createJob, uploadImage } from '@/lib/api/client';
import { useClerkAuthState } from '@/lib/auth/clerk';
import { useAppStore } from '@/lib/store/app-store';

export function useCreateJob() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { getRequiredToken } = useClerkAuthState();
  const selectedImage = useAppStore((state) => state.selectedImage);
  const selectedStyles = useAppStore((state) => state.selectedStyles);
  const prompt = useAppStore((state) => state.prompt);
  const selectedShape = useAppStore((state) => state.selectedShape);
  const setActiveResultStyle = useAppStore((state) => state.setActiveResultStyle);
  const resetDraft = useAppStore((state) => state.resetDraft);

  return useMutation({
    mutationFn: async () => {
      if (!selectedImage) {
        throw new Error('Image is required.');
      }
      const token = await getRequiredToken();

      const upload = await uploadImage({
        uri: selectedImage.uri,
        fileName: selectedImage.fileName,
        mimeType: selectedImage.mimeType,
        token,
      });

      return createJob({
        uploadId: upload.uploadId,
        styles: selectedStyles,
        token,
        prompt,
        shape: selectedShape,
      });
    },
    onSuccess: ({ jobId }) => {
      setActiveResultStyle(null);
      resetDraft();
      void queryClient.invalidateQueries({ queryKey: ['history'] });
      router.replace(`/results/${jobId}`);
    },
  });
}
