import { StyleSheet, Text, View } from 'react-native';

export function Header({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
    rowGap: 8,
  },
  title: {
    fontSize: 38,
    fontWeight: '900',
    color: '#101418',
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: '#57534e',
  },
});
