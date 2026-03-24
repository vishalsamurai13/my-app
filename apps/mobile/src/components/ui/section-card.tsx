import type { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';

export function SectionCard({ children }: PropsWithChildren) {
  return <View style={styles.card}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#d7c9b5',
    backgroundColor: '#fffdf8',
    padding: 16,
  },
});
