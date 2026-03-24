import { useMutation, useQuery } from '@tanstack/react-query';
import type { StyleType } from '@ai-clipart/shared';
import { getJob, retryStyle } from '@/lib/api/client';
import { useAppStore } from '@/lib/store/app-store';

export function useJob(jobId: string) {
  const deviceId = useAppStore((state) => state.deviceId);

  const query = useQuery({
    queryKey: ['job', jobId, deviceId],
    queryFn: () => {
      if (!deviceId) {
        throw new Error('Missing device id.');
      }

      return getJob(jobId, deviceId);
    },
    enabled: Boolean(jobId && deviceId),
    refetchInterval: (query) => {
      const job = query.state.data;
      const inFlight = job?.styles.some((style) => style.status === 'queued' || style.status === 'processing');
      return inFlight ? 2_000 : false;
    },
  });

  const retryMutation = useMutation({
    mutationFn: async (style: StyleType) => {
      if (!deviceId) {
        throw new Error('Missing device id.');
      }

      return retryStyle(jobId, style, deviceId);
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
