import { useMutation, useQuery } from '@tanstack/react-query';
import type { StyleType } from '@ai-clipart/shared';
import { getJob, retryStyle } from '@/lib/api/client';
import { useClerkAuthState } from '@/lib/auth/clerk';

export function useJob(jobId: string) {
  const { getRequiredToken, isSignedIn } = useClerkAuthState();

  const query = useQuery({
    queryKey: ['job', jobId, isSignedIn],
    queryFn: async () => getJob(jobId, await getRequiredToken()),
    enabled: Boolean(jobId && isSignedIn),
    refetchInterval: (query) => {
      const job = query.state.data;
      const inFlight = job?.styles.some((style) => style.status === 'queued' || style.status === 'processing');
      return inFlight ? 2_000 : false;
    },
  });

  const retryMutation = useMutation({
    mutationFn: async (style: StyleType) => {
      return retryStyle(jobId, style, await getRequiredToken());
    },
    onSuccess: (data) => {
      query.refetch();
      return data;
    },
  });

  return {
    ...query,
    retryStyle: retryMutation.mutate,
    isRetrying: retryMutation.isPending,
  };
}
