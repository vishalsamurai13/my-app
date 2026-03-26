import { Text, View } from 'react-native';

export function Header({ title, subtitle, align = 'left' }: { title: string; subtitle?: string; align?: 'left' | 'center' }) {
  return (
    <View className={`mb-6 gap-2 ${align === 'center' ? 'items-center' : ''}`.trim()}>
      <Text className="text-4xl font-black text-primary">{title}</Text>
      {subtitle ? <Text className="text-base leading-6 text-muted text-center">{subtitle}</Text> : null}
    </View>
  );
}
