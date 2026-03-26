import { useAuth } from '@clerk/expo';
import { useQueryClient } from '@tanstack/react-query';
import { STYLE_LABELS } from '@ai-clipart/shared';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { useToast } from '@/components/feedback/toast-provider';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { useJob } from '@/features/generation/use-job';
import { saveRemoteFileToGallery, shareRemoteFile } from '@/features/share-download/file-actions';
import { createShareLink } from '@/lib/api/client';
import { useClerkAuthState } from '@/lib/auth/clerk';
import { useAppStore } from '@/lib/store/app-store';
import { resolveAssetUrl } from '@/utils/asset-url';

export default function ResultScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isSignedIn } = useAuth();
  const { getRequiredToken } = useClerkAuthState();
  const { showToast } = useToast();
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const { data, error, isLoading, retryStyle } = useJob(jobId);
  const activeResultStyle = useAppStore((state) => state.activeResultStyle);
  const setActiveResultStyle = useAppStore((state) => state.setActiveResultStyle);

  const firstSuccessfulStyle = useMemo(
    () => data?.styles.find((style) => style.status === 'success' && style.url),
    [data?.styles],
  );
  const selected = data?.styles.find((style) => style.style === activeResultStyle) ?? firstSuccessfulStyle ?? data?.styles[0];
  const selectedUrl = resolveAssetUrl(selected?.url);
  const isInFlight = data?.styles.some((style) => style.status === 'queued' || style.status === 'processing');
  const hasErrorStyles = data?.styles.some((style) => style.status === 'error');
  const shownErrorIdsRef = useRef<string[]>([]);

  useEffect(() => {
    if (!activeResultStyle && firstSuccessfulStyle) {
      setActiveResultStyle(firstSuccessfulStyle.style);
    }
  }, [activeResultStyle, firstSuccessfulStyle, setActiveResultStyle]);

  useEffect(() => {
    if (data && !isInFlight) {
      void queryClient.invalidateQueries({ queryKey: ['history'] });
    }
  }, [data, isInFlight, queryClient]);

  useEffect(() => {
    const freshErrors =
      data?.styles.filter((style) => style.status === 'error' && !shownErrorIdsRef.current.includes(style.id)) ?? [];

    if (freshErrors.length > 0) {
      shownErrorIdsRef.current = [...shownErrorIdsRef.current, ...freshErrors.map((style) => style.id)];
      const summary = freshErrors.map((style) => `${STYLE_LABELS[style.style]} failed.`).join(' ');
      showToast({
        title: 'Generation issue',
        message: summary,
        variant: 'error',
      });
    }
  }, [data?.styles, showToast]);

  const successfulStyles = data?.styles.filter((style) => style.url) ?? [];
  const previewCount = successfulStyles.length || (data?.styles.length ?? 0);
  const previewWidth = previewCount <= 1 ? '100%' : previewCount === 2 ? '48%' : previewCount === 3 ? '31.5%' : '23.5%';

  async function handleDownload() {
    if (!selectedUrl || !selected) return;
    try {
      await saveRemoteFileToGallery(selectedUrl, `${selected.style}-${jobId}.png`);
      showToast({
        title: 'Saved to gallery',
        message: 'The generated image is now available in your photos.',
        variant: 'success',
      });
    } catch (saveError) {
      showToast({
        title: 'Download failed',
        message: saveError instanceof Error ? saveError.message : 'Unable to save file.',
        variant: 'error',
      });
    }
  }

  async function handleShare() {
    if (!selectedUrl || !selected?.assetId) return;
    try {
      const token = await getRequiredToken();
      const shareLink = await createShareLink(selected.assetId, token);
      await shareRemoteFile(shareLink.shareUrl, `${selected.style}-${jobId}.png`);
      showToast({
        title: 'Ready to share',
        message: 'A public share link was prepared for this image.',
        variant: 'success',
      });
    } catch (shareError) {
      showToast({
        title: 'Share failed',
        message: shareError instanceof Error ? shareError.message : 'Unable to share file.',
        variant: 'error',
      });
    }
  }

  return (
    <Screen backgroundColor="#121212" contentClassName="gap-[18px] pt-6 pb-10">
      <View className="relative flex-row items-center justify-center">
        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          className="absolute left-0 h-11 w-11 items-center justify-center rounded-full bg-border-card">
          <ChevronLeft color="#ffffff" size={22} />
        </Pressable>
        <Text className="text-center text-[34px] font-black text-primary">Results</Text>
      </View>
      {!isSignedIn ? <Text className="text-center text-muted">Sign in is required to view protected results.</Text> : null}
      {isLoading ? <Text className="text-center text-muted">Loading your generation job…</Text> : null}
      {!isLoading && isInFlight ? (
        <Text className="text-center text-muted">Your styles are still processing. Completed outputs will appear one by one.</Text>
      ) : null}
      {!isLoading && !isInFlight && hasErrorStyles ? (
        <Text className="text-center text-muted">Some styles failed. Retry only the failed ones from the strip below.</Text>
      ) : null}
      {error ? <Text className="text-center text-error">{error instanceof Error ? error.message : 'Unable to load this job.'}</Text> : null}

      {selectedUrl ? (
        <Image source={{ uri: selectedUrl }} style={{ width: '100%', aspectRatio: 1, borderRadius: 28 }} />
      ) : (
        <View className="w-full aspect-square items-center justify-center gap-2.5 rounded-[28px] border border-border-card bg-card px-7">
          <Text className="text-[20px] font-extrabold text-primary">{selected?.status === 'error' ? 'Preview unavailable' : 'Generating preview'}</Text>
          <Text className="text-center leading-[22px] text-muted">
            {selected?.status === 'error'
              ? 'Retry this style from the cards below.'
              : 'The first completed style will automatically appear here.'}
          </Text>
        </View>
      )}

      <View className="flex-row flex-wrap gap-3">
        {data?.styles.map((style) => {
          const uri = resolveAssetUrl(style.url);
          const active = selected?.id === style.id;

          return (
            <Pressable
              key={style.id}
              className={`rounded-[18px] border bg-card p-1.5 ${active ? 'border-border-accent' : 'border-border-card'}`}
              style={{ width: previewWidth }}
              onPress={() => setActiveResultStyle(style.style)}>
              {uri ? (
                <Image source={{ uri }} style={{ width: '100%', aspectRatio: 1, borderRadius: 12, marginBottom: 8, backgroundColor: '#2b2340' }} />
              ) : (
                <View className="mb-2 aspect-square w-full items-center justify-center rounded-xl bg-thumb-bg">
                  <Text className="text-[11px] font-bold text-[#b9b2c7]">
                    {style.status === 'error' ? 'Failed' : style.status === 'processing' ? 'Processing' : 'Queued'}
                  </Text>
                </View>
              )}
              <Text className="text-center text-lg font-bold text-primary">{STYLE_LABELS[style.style]}</Text>
              <Text className="mt-1 text-center text-xs text-muted">{style.status === 'success' ? 'Ready' : style.status}</Text>
              {style.status === 'error' ? (
                <Pressable
                  onPress={() => {
                    retryStyle(style.style);
                    showToast({
                      title: 'Retry started',
                      message: `${STYLE_LABELS[style.style]} is being generated again.`,
                      variant: 'info',
                    });
                  }}
                  className="self-center">
                  <Text className="mt-1.5 text-center font-bold text-[#c9b0ff]">Retry</Text>
                </Pressable>
              ) : null}
            </Pressable>
          );
        })}
      </View>

      <View className="flex-row gap-3">
        <Button variant="secondary" onPress={handleShare} disabled={!selectedUrl || !selected?.assetId}>
          Share
        </Button>
        <Button onPress={handleDownload} disabled={!selectedUrl}>
          Download
        </Button>
      </View>

      <Button variant="outline" onPress={() => router.push('/create' as never)}>
        Generate New Images
      </Button>
    </Screen>
  );
}
