import { useSSO } from '@clerk/expo';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as AuthSession from 'expo-auth-session';
import { Alert, Pressable, Text, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';

export default function SignInScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ redirectTo?: string }>();
  const { startSSOFlow } = useSSO();

  async function handleGoogle() {
    try {
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: 'oauth_google',
        redirectUrl: AuthSession.makeRedirectUri(),
      });

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        router.replace(((params.redirectTo as string) || '/(tabs)') as never);
      }
    } catch (error) {
      Alert.alert('Sign in failed', error instanceof Error ? error.message : 'Unable to sign in with Google.');
    }
  }

  return (
    <Screen scroll={false} backgroundColor="#101014" contentClassName="flex-1 justify-end">
      <View className="mb-6 gap-4 rounded-xl4 bg-sheet p-6">
        <Text className="text-[26px] font-extrabold leading-[30px] text-dark">Sign in to generate and save images</Text>
        <Text className="text-[15px] leading-[22px] text-[#6d6b78]">
          Use Google to unlock generation history, downloads, and profile sync.
        </Text>
        <Button onPress={handleGoogle}>Continue with Google</Button>
        <Pressable onPress={() => router.back()} className="items-center pt-1">
          <Text className="font-bold text-brand-deep">Maybe later</Text>
        </Pressable>
      </View>
    </Screen>
  );
}
