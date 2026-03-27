import { useAuth, useClerk } from '@clerk/expo';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { Settings } from 'lucide-react-native';
import { useToast } from '@/components/feedback/toast-provider';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { useHistory } from '@/features/history/use-history';
import { useMe } from '@/features/profile/use-me';
import { useUpdateMe } from '@/features/profile/use-update-me';
import { resolveAssetUrl } from '@/utils/asset-url';

function formatDateForInput(value: string | null | undefined) {
  if (!value) return '';
  const [year, month, day] = value.split('-');
  if (!year || !month || !day) return '';
  return `${day}/${month}/${year}`;
}

function parseDateInput(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return { ok: true as const, value: null };

  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(trimmed);
  if (!match) {
    return { ok: false as const, reason: 'Use DD/MM/YYYY for date of birth.' };
  }

  const [, day, month, year] = match;
  const parsed = new Date(`${year}-${month}-${day}T00:00:00.000Z`);
  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.getUTCFullYear() !== Number(year) ||
    parsed.getUTCMonth() + 1 !== Number(month) ||
    parsed.getUTCDate() !== Number(day)
  ) {
    return { ok: false as const, reason: 'Enter a valid date of birth.' };
  }

  return { ok: true as const, value: `${year}-${month}-${day}` };
}

export default function ProfileTab() {
  const router = useRouter();
  const { signOut } = useClerk();
  const { isSignedIn } = useAuth();
  const { showToast } = useToast();
  const meQuery = useMe();
  const updateMeMutation = useUpdateMe();
  const historyQuery = useHistory();
  const assets = historyQuery.data?.jobs.flatMap((job) => job.styles.filter((style) => style.url)) ?? [];
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [email, setEmail] = useState('');

  const fallbackName = useMemo(() => {
    if (!meQuery.data) return '';
    if (meQuery.data.firstName || meQuery.data.lastName) {
      return `${meQuery.data.firstName ?? ''} ${meQuery.data.lastName ?? ''}`.trim();
    }
    return '';
  }, [meQuery.data]);

  useEffect(() => {
    setFullName(meQuery.data?.displayName ?? fallbackName);
    setDateOfBirth(formatDateForInput(meQuery.data?.dateOfBirth));
    setEmail(meQuery.data?.email ?? '');
  }, [fallbackName, meQuery.data?.dateOfBirth, meQuery.data?.displayName, meQuery.data?.email]);

  const isDirty = useMemo(() => {
    const savedName = (meQuery.data?.displayName ?? fallbackName).trim();
    const savedDob = formatDateForInput(meQuery.data?.dateOfBirth).trim();
    return fullName.trim() !== savedName || dateOfBirth.trim() !== savedDob;
  }, [dateOfBirth, fallbackName, fullName, meQuery.data?.dateOfBirth, meQuery.data?.displayName]);

  async function handleLogout() {
    await signOut();
    router.replace('/welcome' as never);
  }

  async function handleSaveProfile() {
    const trimmedName = fullName.trim();
    if (!trimmedName) {
      showToast({
        title: 'Name required',
        message: 'Add your name before saving your profile.',
        variant: 'error',
      });
      return;
    }

    const parsedDob = parseDateInput(dateOfBirth);
    if (!parsedDob.ok) {
      showToast({
        title: 'Invalid date of birth',
        message: parsedDob.reason,
        variant: 'error',
      });
      return;
    }

    try {
      await updateMeMutation.mutateAsync({
        displayName: trimmedName,
        dateOfBirth: parsedDob.value,
      });
      showToast({
        title: 'Profile updated',
        message: 'Your profile settings were saved successfully.',
        variant: 'success',
      });
      setSettingsOpen(false);
    } catch (saveError) {
      showToast({
        title: 'Unable to save profile',
        message: saveError instanceof Error ? saveError.message : 'Please try again.',
        variant: 'error',
      });
    }
  }

  return (
    <Screen scroll={false} backgroundColor="#121212" contentClassName="gap-6 pt-6">
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
                <Text className="text-[28px] font-extrabold text-primary">{(meQuery.data?.displayName ?? fallbackName) || 'Your Profile'}</Text>
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
              <Button variant="secondary" onPress={() => void handleSaveProfile()} loading={updateMeMutation.isPending}>
                Save Changes
              </Button>
              {isDirty ? <Text className="text-center text-xs font-semibold text-[#cfbefa]">You have unsaved profile changes.</Text> : null}
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

          <View className="flex-1">
            <FlatList
              data={assets}
              keyExtractor={(item) => item.id}
              numColumns={2}
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingBottom: 96, rowGap: 12, flexGrow: assets.length === 0 ? 1 : 0 }}
              columnWrapperStyle={assets.length > 0 ? { justifyContent: 'space-between' } : undefined}
              renderItem={({ item }) => {
                const uri = resolveAssetUrl(item.url);
                return uri ? (
                  <Image source={{ uri }} style={{ width: '48%', aspectRatio: 0.76, borderRadius: 18, backgroundColor: '#1a1423' }} />
                ) : (
                  <View style={{ width: '48%', aspectRatio: 0.76, borderRadius: 18, backgroundColor: '#1a1423' }} />
                );
              }}
              ListEmptyComponent={
                historyQuery.isLoading ? null : (
                  <View className="mt-3 items-center gap-2 rounded-[20px] border border-border-card bg-card px-4 py-6">
                    <Text className="text-center text-lg font-bold text-primary">No generations yet</Text>
                    <Text className="text-center text-[15px] leading-[22px] text-muted">
                      Your generated images will appear here once you create them.
                    </Text>
                  </View>
                )
              }
            />
          </View>
        </>
      ) : null}
    </Screen>
  );
}
