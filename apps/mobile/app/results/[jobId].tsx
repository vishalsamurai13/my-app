import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { STYLE_LABELS } from '@ai-clipart/shared';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { SectionCard } from '@/components/ui/section-card';
import { useJob } from '@/features/generation/use-job';
import { saveRemoteFile, shareRemoteFile } from '@/features/share-download/file-actions';
import { resolveAssetUrl } from '@/utils/asset-url';

export default function ResultScreen() {
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const { data, error, isLoading, retryStyle } = useJob(jobId);

  async function handleDownload(url: string, style: string) {
    try {
      await saveRemoteFile(url, `${style}-${jobId}.png`);
      Alert.alert('Saved', 'The generated image was downloaded to the app cache.');
    } catch (saveError) {
      Alert.alert('Download failed', saveError instanceof Error ? saveError.message : 'Unable to save file.');
    }
  }

  async function handleShare(url: string, style: string) {
    try {
      await shareRemoteFile(url, `${style}-${jobId}.png`);
    } catch (shareError) {
      Alert.alert('Share failed', shareError instanceof Error ? shareError.message : 'Unable to share file.');
    }
  }

  return (
    <Screen>
      <Header
        title="Results"
        subtitle="Each style runs independently. Failed styles can be retried without restarting the full batch."
      />

      {isLoading ? <Text style={styles.loadingText}>Checking job status…</Text> : null}
      {error ? (
        <SectionCard>
          <Text style={styles.errorText}>
            {error instanceof Error ? error.message : 'Unable to load the generation job.'}
          </Text>
        </SectionCard>
      ) : null}

      <View style={styles.list}>
        {data?.styles.map((style) => {
          const assetUrl = resolveAssetUrl(style.url);

          return (
          <SectionCard key={style.id}>
            <View style={styles.cardBody}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{STYLE_LABELS[style.style]}</Text>
                <Text style={styles.cardStatus}>{style.status}</Text>
              </View>

              {assetUrl ? (
                <Image source={{ uri: assetUrl }} style={styles.resultImage} />
              ) : (
                <View style={styles.placeholder} />
              )}

              {style.error ? <Text style={styles.errorText}>{style.error}</Text> : null}

              <View style={styles.actionRow}>
                {style.status === 'error' ? (
                  <Button variant="secondary" onPress={() => retryStyle(style.style)}>
                    Retry style
                  </Button>
                ) : null}
                {assetUrl ? (
                  <>
                    <Button variant="ghost" onPress={() => handleDownload(assetUrl, style.style)}>
                      Download
                    </Button>
                    <Button variant="ghost" onPress={() => handleShare(assetUrl, style.style)}>
                      Share
                    </Button>
                  </>
                ) : null}
              </View>
            </View>
          </SectionCard>
        )})}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loadingText: {
    fontSize: 16,
    color: '#57534e',
  },
  errorText: {
    fontSize: 14,
    color: '#b3261e',
  },
  list: {
    rowGap: 16,
  },
  cardBody: {
    rowGap: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#101418',
  },
  cardStatus: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: '#78716c',
  },
  resultImage: {
    width: '100%',
    height: 220,
    borderRadius: 24,
  },
  placeholder: {
    height: 220,
    borderRadius: 24,
    backgroundColor: '#e6dccd',
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
});
