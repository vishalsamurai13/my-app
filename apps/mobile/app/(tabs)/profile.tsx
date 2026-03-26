import { useAuth, useClerk } from '@clerk/expo';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { Settings } from 'lucide-react-native';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { useHistory } from '@/features/history/use-history';
import { useMe } from '@/features/profile/use-me';
import { resolveAssetUrl } from '@/utils/asset-url';

export default function ProfileTab() {
  const router = useRouter();
  const { signOut } = useClerk();
  const { isSignedIn } = useAuth();
  const meQuery = useMe();
  const historyQuery = useHistory();
  const assets = historyQuery.data?.jobs.flatMap((job) => job.styles.filter((style) => style.url)) ?? [];
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    const resolvedName = meQuery.data?.firstName || meQuery.data?.lastName
      ? `${meQuery.data?.firstName ?? ''} ${meQuery.data?.lastName ?? ''}`.trim()
      : '';

    setFullName(resolvedName);
    setEmail(meQuery.data?.email ?? '');
  }, [meQuery.data?.email, meQuery.data?.firstName, meQuery.data?.lastName]);

  async function handleLogout() {
    await signOut();
    router.replace('/welcome' as never);
  }

  function handleSaveProfile() {
    Alert.alert('Profile fields updated locally', 'Wire these fields to a backend profile update route when you are ready to persist them.');
  }

  return (
    <Screen scroll={false} backgroundColor="#121212" contentClassName="gap-6 pt-6 pb-[120px]">
      {!isSignedIn ? (
        <>
          <Text className="text-[34px] font-black text-primary">Profile</Text>
          <View className="gap-[14px] rounded-xl4 border border-border-card bg-card p-[18px]">
            <Text className="text-2xl font-extrabold text-primary">Sign in to save your generated images.</Text>
            <Text className="text-[15px] leading-[22px] text-muted">
              Your gallery, downloads, and synced history are available once you connect your account.
            </Text>
            <Button onPress={() => router.push('/sign-in?redirectTo=/(tabs)/profile' as never)}>Continue with Google</Button>
          </View>
        </>
      ) : null}

      {isSignedIn ? (
        <>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-[14px]">
              {meQuery.data?.imageUrl ? (
                <Image source={{ uri: meQuery.data.imageUrl }} style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: '#302646' }} />
              ) : (
                <View className="h-[60px] w-[60px] rounded-full bg-[#302646]" />
              )}
              <View className="gap-1">
                <Text className="text-[28px] font-extrabold text-primary">
                  {meQuery.data?.firstName || meQuery.data?.lastName
                    ? `${meQuery.data?.firstName ?? ''} ${meQuery.data?.lastName ?? ''}`.trim()
                    : 'Your Profile'}
                </Text>
                <Text className="text-base text-muted">{meQuery.data?.email ?? 'No email available'}</Text>
              </View>
            </View>
            <Pressable onPress={() => setSettingsOpen((current) => !current)} className="h-10 w-10 items-center justify-center rounded-full border border-border-card">
              <Settings color="#ffffff" size={20} />
            </Pressable>
          </View>

          {settingsOpen ? (
            <View className="gap-3 rounded-xl4 border border-border-card bg-card p-[18px]">
              <Text className="text-xl font-bold text-primary">Profile Settings</Text>
              <View className="gap-2">
                <Text className="text-sm font-semibold text-secondary">Full name</Text>
                <TextInput
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Enter your name"
                  placeholderTextColor="#7b7589"
                  className="rounded-2xl border border-border-card bg-[#15111d] px-4 py-3 text-primary"
                />
              </View>
              <View className="gap-2">
                <Text className="text-sm font-semibold text-secondary">Date of birth</Text>
                <TextInput
                  value={dateOfBirth}
                  onChangeText={setDateOfBirth}
                  placeholder="DD/MM/YYYY"
                  placeholderTextColor="#7b7589"
                  className="rounded-2xl border border-border-card bg-[#15111d] px-4 py-3 text-primary"
                />
              </View>
              <View className="gap-2">
                <Text className="text-sm font-semibold text-secondary">Email</Text>
                <TextInput
                  editable={false}
                  value={email}
                  className="rounded-2xl border border-border-card bg-[#15111d] px-4 py-3 text-muted"
                />
              </View>
              <Button variant="secondary" onPress={handleSaveProfile}>
                Save Changes
              </Button>
              <Button variant="outline" onPress={() => void handleLogout()}>
                Log Out
              </Button>
            </View>
          ) : null}

          {meQuery.isLoading ? <Text className="text-[15px] text-muted">Loading your profile…</Text> : null}
          {meQuery.error ? (
            <Text className="text-sm leading-5 text-error">
              {meQuery.error instanceof Error ? meQuery.error.message : 'Unable to load profile details.'}
            </Text>
          ) : null}
          {historyQuery.isLoading ? <Text className="text-[15px] text-muted">Loading your gallery…</Text> : null}
          {historyQuery.error ? (
            <Text className="text-sm leading-5 text-error">
              {historyQuery.error instanceof Error ? historyQuery.error.message : 'Unable to load your generation history.'}
            </Text>
          ) : null}

          <FlatList
            data={assets}
            keyExtractor={(item) => item.id}
            numColumns={2}
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 120, rowGap: 12 }}
            columnWrapperStyle={{ justifyContent: 'space-between' }}
            renderItem={({ item }) => {
              const uri = resolveAssetUrl(item.url);
              return uri ? (
                <Image source={{ uri }} style={{ width: '48%', aspectRatio: 0.76, borderRadius: 18, backgroundColor: '#1a1423' }} />
              ) : (
                <View style={{ width: '48%', aspectRatio: 0.76, borderRadius: 18, backgroundColor: '#1a1423' }} />
              );
            }}
            ListEmptyComponent={
              <Text className="mt-3 text-center text-[15px] leading-[22px] text-muted">
                Your generated images will appear here once you create them.
              </Text>
            }
          />
        </>
      ) : null}
    </Screen>
  );
}
