import { useQuery } from '@tanstack/react-query';
import { getMe } from '@/lib/api/client';
import { useClerkAuthState } from '@/lib/auth/clerk';

export function useMe() {
  const { getRequiredToken, isSignedIn } = useClerkAuthState();

  return useQuery({
    queryKey: ['me', isSignedIn],
    queryFn: async () => getMe(await getRequiredToken()),
    enabled: Boolean(isSignedIn),
  });
}
