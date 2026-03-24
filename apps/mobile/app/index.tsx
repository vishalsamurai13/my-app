import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { SectionCard } from '@/components/ui/section-card';
import { useImageSelection } from '@/features/image-upload/use-image-selection';

export default function HomeScreen() {
  const router = useRouter();
  const { error, handlePick, isPicking } = useImageSelection();

  return (
    <Screen>
      <Header
        title="AI Clipart"
        subtitle="Transform one portrait into five polished illustration styles with independent progress, retries, and history."
      />

      <View style={styles.hero}>
        <Text style={styles.heroEyebrow}>Android-ready flow</Text>
        <Text style={styles.heroTitle}>
          Upload, generate, save, and share without leaving the app.
        </Text>
      </View>

      <View style={styles.buttonGroup}>
        <Button loading={isPicking} onPress={() => handlePick('camera')}>
          Capture with camera
        </Button>
        <Button loading={isPicking} onPress={() => handlePick('gallery')} variant="secondary">
          Choose from gallery
        </Button>
      </View>

      {error ? (
        <SectionCard>
          <Text style={styles.errorText}>{error}</Text>
        </SectionCard>
      ) : null}

      <View style={styles.historyAction}>
        <Button onPress={() => router.push('/history')} variant="ghost">
          Open history
        </Button>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    marginBottom: 20,
    borderRadius: 32,
    backgroundColor: '#101418',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  heroEyebrow: {
    marginBottom: 12,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: '#e6dccd',
  },
  heroTitle: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '900',
    color: '#ffffff',
  },
  buttonGroup: {
    marginBottom: 20,
    rowGap: 12,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#b3261e',
  },
  historyAction: {
    marginTop: 20,
  },
});
