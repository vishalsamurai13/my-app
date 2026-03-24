import { useQuery } from '@tanstack/react-query';
import { getHistory } from '@/lib/api/client';
import { useAppStore } from '@/lib/store/app-store';

export function useHistory() {
  const deviceId = useAppStore((state) => state.deviceId);

  return useQuery({
    queryKey: ['history', deviceId],
    queryFn: () => {
      if (!deviceId) {
        throw new Error('Missing device id.');
      }

      return getHistory(deviceId);
    },
    enabled: Boolean(deviceId),
  });
}
