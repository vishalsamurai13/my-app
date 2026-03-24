import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { SectionCard } from '@/components/ui/section-card';
import { useHistory } from '@/features/history/use-history';
import { resolveAssetUrl } from '@/utils/asset-url';

export default function HistoryScreen() {
  const router = useRouter();
  const historyQuery = useHistory();

  return (
    <Screen>
      <Header
        title="History"
        subtitle="Every job is tied to the anonymous device id so completed outputs stay available after the app restarts."
      />

      {historyQuery.isLoading ? <Text style={styles.loadingText}>Loading history…</Text> : null}

      {historyQuery.data?.jobs.map((job) => {
        const preview = job.styles.find((style) => style.url);
        const previewUrl = resolveAssetUrl(preview?.url);

        return (
          <SectionCard key={job.id}>
            <View style={styles.row}>
              {previewUrl ? (
                <Image source={{ uri: previewUrl }} style={styles.thumbnail} />
              ) : (
                <View style={styles.thumbnailPlaceholder} />
              )}
              <View style={styles.meta}>
                <Text style={styles.jobTitle}>{job.id}</Text>
                <Text style={styles.jobSubtitle}>{job.styles.length} style variants</Text>
                <Button onPress={() => router.push(`/results/${job.id}`)} variant="ghost">
                  View results
                </Button>
              </View>
            </View>
          </SectionCard>
        );
      })}

      {historyQuery.data?.jobs.length === 0 ? (
        <SectionCard>
          <Text style={styles.emptyText}>
            No history yet. Generate your first batch from the home screen.
          </Text>
        </SectionCard>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loadingText: {
    fontSize: 16,
    color: '#57534e',
  },
  row: {
    flexDirection: 'row',
    columnGap: 16,
  },
  thumbnail: {
    width: 92,
    height: 92,
    borderRadius: 20,
  },
  thumbnailPlaceholder: {
    width: 92,
    height: 92,
    borderRadius: 20,
    backgroundColor: '#e6dccd',
  },
  meta: {
    flex: 1,
    rowGap: 8,
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#101418',
  },
  jobSubtitle: {
    fontSize: 14,
    color: '#57534e',
  },
  emptyText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#57534e',
  },
});
