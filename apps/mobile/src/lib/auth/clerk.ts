import { useAuth } from '@clerk/clerk-expo';

export function useClerkAuthState() {
  const auth = useAuth();

  async function getRequiredToken() {
    const token = await auth.getToken();
    if (!token) {
      throw new Error('Please sign in to continue.');
    }
    return token;
  }

  return {
    ...auth,
    getRequiredToken,
  };
}
