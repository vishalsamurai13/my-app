import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useAuth, useClerk } from '@clerk/expo';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, FlatList, Platform, Pressable, ScrollView, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { Download, Settings, Share2 } from 'lucide-react-native';
import { createShareLink } from '@/lib/api/client';
import { useClerkAuthState } from '@/lib/auth/clerk';
import { useToast } from '@/components/feedback/toast-provider';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { useHistory } from '@/features/history/use-history';
import { saveRemoteFileToGallery, shareRemoteFile } from '@/features/share-download/file-actions';
import { useMe } from '@/features/profile/use-me';
import { useUpdateMe } from '@/features/profile/use-update-me';
import { resolveAssetUrl } from '@/utils/asset-url';

function parseIsoDate(value: string | null | undefined) {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);

  if (!year || !month || !day) {
    return null;
  }

  return new Date(year, month - 1, day);
}

function formatDateForDisplay(value: Date | null) {
  if (!value) return '';

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(value);
}

function formatDateForPayload(value: Date | null) {
  if (!value) return null;

  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, '0');
  const day = `${value.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function ProfileTab() {
  const router = useRouter();
  const { height: windowHeight } = useWindowDimensions();
  const { signOut } = useClerk();
  const { isSignedIn } = useAuth();
  const { getRequiredToken } = useClerkAuthState();
  const { showToast } = useToast();
  const meQuery = useMe();
  const updateMeMutation = useUpdateMe();
  const historyQuery = useHistory();
  const assets = historyQuery.data?.jobs.flatMap((job) => job.styles.filter((style) => style.url)) ?? [];
  const panelProgress = useRef(new Animated.Value(0)).current;
  const cardActionsProgress = useRef(new Animated.Value(0)).current;
  const [panelMounted, setPanelMounted] = useState(false);
  const [fullName, setFullName] = useState('');
  const [selectedDob, setSelectedDob] = useState<Date | null>(null);
  const [showDobPicker, setShowDobPicker] = useState(false);
  const [activeAssetId, setActiveAssetId] = useState<string | null>(null);

  const fallbackName = useMemo(() => {
    if (!meQuery.data) return '';
    if (meQuery.data.firstName || meQuery.data.lastName) {
      return `${meQuery.data.firstName ?? ''} ${meQuery.data.lastName ?? ''}`.trim();
    }
    return '';
  }, [meQuery.data]);

  const panelMaxHeight = Math.max(360, windowHeight - 280);
  const panelHeight = panelProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, panelMaxHeight],
  });
  const panelTranslateY = panelProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [-18, 0],
  });
  const cardActionsTranslateY = cardActionsProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [14, 0],
  });

  useEffect(() => {
    setFullName(meQuery.data?.displayName ?? fallbackName);
    setSelectedDob(parseIsoDate(meQuery.data?.dateOfBirth));
  }, [fallbackName, meQuery.data?.dateOfBirth, meQuery.data?.displayName]);

  const isDirty = useMemo(() => {
    const savedName = (meQuery.data?.displayName ?? fallbackName).trim();
    const savedDob = meQuery.data?.dateOfBirth ?? null;
    return fullName.trim() !== savedName || formatDateForPayload(selectedDob) !== savedDob;
  }, [fallbackName, fullName, meQuery.data?.dateOfBirth, meQuery.data?.displayName, selectedDob]);

  function animatePanel(toValue: 0 | 1, onEnd?: () => void) {
    Animated.timing(panelProgress, {
      toValue,
      duration: 240,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        onEnd?.();
      }
    });
  }

  function openSettingsPanel() {
    setActiveAssetId(null);
    setShowDobPicker(false);
    setPanelMounted(true);
    animatePanel(1);
  }

  function closeSettingsPanel() {
    setShowDobPicker(false);
    animatePanel(0, () => {
      setPanelMounted(false);
    });
  }

  function toggleSettingsPanel() {
    if (panelMounted) {
      closeSettingsPanel();
      return;
    }

    openSettingsPanel();
  }

  function animateCardActions(toValue: 0 | 1, onEnd?: () => void) {
    Animated.timing(cardActionsProgress, {
      toValue,
      duration: 180,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        onEnd?.();
      }
    });
  }

  function handleToggleCardActions(assetId: string) {
    if (activeAssetId === assetId) {
      animateCardActions(0, () => setActiveAssetId(null));
      return;
    }

    if (activeAssetId) {
      animateCardActions(0, () => {
        setActiveAssetId(assetId);
        cardActionsProgress.setValue(0);
        animateCardActions(1);
      });
      return;
    }

    setActiveAssetId(assetId);
    cardActionsProgress.setValue(0);
    animateCardActions(1);
  }

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

    try {
      await updateMeMutation.mutateAsync({
        displayName: trimmedName,
        dateOfBirth: formatDateForPayload(selectedDob),
      });
      showToast({
        title: 'Profile updated',
        message: 'Your profile settings were saved successfully.',
        variant: 'success',
      });
      closeSettingsPanel();
    } catch (saveError) {
      showToast({
        title: 'Unable to save profile',
        message: saveError instanceof Error ? saveError.message : 'Please try again.',
        variant: 'error',
      });
    }
  }

  function handleDobChange(event: DateTimePickerEvent, date?: Date) {
    if (Platform.OS === 'android') {
      setShowDobPicker(false);
    }

    if (event.type === 'dismissed') {
      return;
    }

    if (date) {
      setSelectedDob(date);
    }
  }

  async function handleAssetDownload(asset: (typeof assets)[number]) {
    const url = resolveAssetUrl(asset.url);
    if (!url) return;

    try {
      await saveRemoteFileToGallery(url, `${asset.style}-${asset.id}.png`);
      showToast({
        title: 'Saved to gallery',
        message: 'The generated image is now available in your photos.',
        variant: 'success',
      });
    } catch (saveError) {
      showToast({
        title: 'Download failed',
        message: saveError instanceof Error ? saveError.message : 'Unable to save image.',
        variant: 'error',
      });
    }
  }

  async function handleAssetShare(asset: (typeof assets)[number]) {
    const url = resolveAssetUrl(asset.url);
    if (!url || !asset.assetId) return;

    try {
      const token = await getRequiredToken();
      const shareLink = await createShareLink(asset.assetId, token);
      await shareRemoteFile(shareLink.shareUrl, `${asset.style}-${asset.id}.png`);
      showToast({
        title: 'Ready to share',
        message: 'A public share link was prepared for this image.',
        variant: 'success',
      });
    } catch (shareError) {
      showToast({
        title: 'Share failed',
        message: shareError instanceof Error ? shareError.message : 'Unable to share image.',
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
        <View className="flex-1 gap-4">
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
            <Pressable onPress={toggleSettingsPanel} className="h-10 w-10 items-center justify-center rounded-full border border-border-card">
              <Settings color="#ffffff" size={20} />
            </Pressable>
          </View>

          {panelMounted ? (
            <Animated.View
              className="overflow-hidden rounded-xl4 border border-border-card bg-card"
              style={{
                height: panelHeight,
                opacity: panelProgress,
                transform: [{ translateY: panelTranslateY }],
              }}>
              <ScrollView bounces={false} contentContainerStyle={{ minHeight: panelMaxHeight }}>
                <View className="flex-1 gap-4 p-[18px]" style={{ minHeight: panelMaxHeight }}>
                  <View className="gap-1">
                    <Text className="text-[24px] font-extrabold text-primary">Update Profile</Text>
                    <Text className="text-[14px] leading-[21px] text-muted">
                      Keep your display name and birthday in sync for a more personalized experience.
                    </Text>
                  </View>

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
                    <Pressable
                      onPress={() => setShowDobPicker(true)}
                      className="rounded-2xl border border-border-card bg-[#15111d] px-4 py-3">
                      <Text className={selectedDob ? 'text-primary' : 'text-muted'}>
                        {selectedDob ? formatDateForDisplay(selectedDob) : 'Select your date of birth'}
                      </Text>
                    </Pressable>
                    {showDobPicker ? (
                      <DateTimePicker
                        value={selectedDob ?? new Date(2000, 0, 1)}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'calendar'}
                        maximumDate={new Date()}
                        minimumDate={new Date(1900, 0, 1)}
                        onChange={handleDobChange}
                      />
                    ) : null}
                  </View>

                  <View className="gap-2">
                    <Text className="text-sm font-semibold text-secondary">Email</Text>
                    <TextInput
                      editable={false}
                      value={meQuery.data?.email ?? ''}
                      className="rounded-2xl border border-border-card bg-[#15111d] px-4 py-3 text-muted"
                    />
                  </View>

                  <Button variant="secondary" onPress={() => void handleSaveProfile()} loading={updateMeMutation.isPending}>
                    Save Changes
                  </Button>
                  {isDirty ? <Text className="text-center text-xs font-semibold text-[#cfbefa]">You have unsaved profile changes.</Text> : null}

                  <View className="mt-auto pt-6">
                    <Button variant="outline" onPress={() => void handleLogout()}>
                      Log Out
                    </Button>
                  </View>
                </View>
              </ScrollView>
            </Animated.View>
          ) : (
            <>
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
                  onScrollBeginDrag={() => {
                    if (activeAssetId) {
                      animateCardActions(0, () => setActiveAssetId(null));
                    }
                  }}
                  renderItem={({ item }) => {
                    const uri = resolveAssetUrl(item.url);
                    const isActive = activeAssetId === item.id;

                    return (
                      <Pressable style={{ width: '48%' }} onPress={() => handleToggleCardActions(item.id)}>
                        <View className="relative overflow-hidden rounded-[18px] bg-[#1a1423]" style={{ aspectRatio: 0.76 }}>
                          {uri ? (
                            <Image source={{ uri }} style={{ width: '100%', height: '100%' }} />
                          ) : (
                            <View className="h-full w-full bg-[#1a1423]" />
                          )}

                          {isActive ? (
                            <Animated.View
                              className="absolute bottom-3 right-3 flex-row gap-2"
                              style={{
                                opacity: cardActionsProgress,
                                transform: [{ translateY: cardActionsTranslateY }],
                              }}>
                              <Pressable
                                onPress={() => void handleAssetDownload(item)}
                                className="h-10 w-10 items-center justify-center rounded-2xl border border-border-card bg-[#18131f]/95">
                                <Download color="#ffffff" size={18} />
                              </Pressable>
                              <Pressable
                                onPress={() => void handleAssetShare(item)}
                                className="h-10 w-10 items-center justify-center rounded-2xl border border-border-card bg-[#18131f]/95">
                                <Share2 color="#ffffff" size={18} />
                              </Pressable>
                            </Animated.View>
                          ) : null}
                        </View>
                      </Pressable>
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
          )}
        </View>
      ) : null}
    </Screen>
  );
}
