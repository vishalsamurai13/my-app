import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateMe } from '@/lib/api/client';
import { useClerkAuthState } from '@/lib/auth/clerk';

export function useUpdateMe() {
  const queryClient = useQueryClient();
  const { getRequiredToken } = useClerkAuthState();

  return useMutation({
    mutationFn: async (input: { displayName?: string | null; dateOfBirth?: string | null }) =>
      updateMe({
        token: await getRequiredToken(),
        ...input,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });
}
