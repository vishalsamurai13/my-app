import type { PropsWithChildren } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';

type ScreenProps = PropsWithChildren<{
  scroll?: boolean;
}>;

export function Screen({ children, scroll = true }: ScreenProps) {
  const content = scroll ? (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <View style={styles.content}>{children}</View>
    </ScrollView>
  ) : (
    <View style={styles.content}>{children}</View>
  );

  return <SafeAreaView style={styles.safeArea}>{content}</SafeAreaView>;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f0e8',
  },
  content: {
    flex: 1,
    backgroundColor: '#f5f0e8',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
});
