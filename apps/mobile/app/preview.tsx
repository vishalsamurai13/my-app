import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { STYLE_LABELS, STYLE_TYPES } from '@ai-clipart/shared';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { SectionCard } from '@/components/ui/section-card';
import { useCreateJob } from '@/features/generation/use-create-job';
import { useAppStore } from '@/lib/store/app-store';

export default function PreviewScreen() {
  const image = useAppStore((state) => state.selectedImage);
  const selectedStyles = useAppStore((state) => state.selectedStyles);
  const toggleStyle = useAppStore((state) => state.toggleStyle);
  const createJobMutation = useCreateJob();

  if (!image) {
    router.replace('/');
    return null;
  }

  return (
    <Screen>
      <Header
        title="Preview"
        subtitle="Review the selected image, trim the requested styles, and start the asynchronous generation job."
      />

      <SectionCard>
        <Image source={{ uri: image.uri }} style={styles.previewImage} />
      </SectionCard>

      <View style={styles.stylesBlock}>
        <Text style={styles.stylesTitle}>Styles</Text>
        <View style={styles.stylesGrid}>
          {STYLE_TYPES.map((style) => {
            const active = selectedStyles.includes(style);

            return (
              <Pressable
                key={style}
                style={[styles.styleChip, active ? styles.styleChipActive : styles.styleChipInactive]}
                onPress={() => toggleStyle(style)}>
                <Text style={[styles.styleChipLabel, active ? styles.styleChipLabelActive : null]}>
                  {STYLE_LABELS[style]}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {createJobMutation.error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>
            {createJobMutation.error instanceof Error
              ? createJobMutation.error.message
              : 'Unable to create generation job.'}
          </Text>
        </View>
      ) : null}

      <View style={styles.actionGroup}>
        <Button loading={createJobMutation.isPending} onPress={() => createJobMutation.mutate()}>
          Generate cliparts
        </Button>
        <Button onPress={() => router.back()} variant="ghost">
          Back
        </Button>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  previewImage: {
    width: '100%',
    height: 320,
    borderRadius: 24,
  },
  stylesBlock: {
    marginTop: 20,
    rowGap: 12,
  },
  stylesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#101418',
  },
  stylesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  styleChip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  styleChipActive: {
    borderColor: '#d65a31',
    backgroundColor: '#d65a31',
  },
  styleChipInactive: {
    borderColor: '#d7c9b5',
    backgroundColor: '#fffdf8',
  },
  styleChipLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#101418',
  },
  styleChipLabelActive: {
    color: '#ffffff',
  },
  errorBox: {
    marginTop: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#fef2f2',
    padding: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#b3261e',
  },
  actionGroup: {
    marginTop: 32,
    rowGap: 12,
  },
});
