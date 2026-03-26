import type { PropsWithChildren } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type ScreenProps = PropsWithChildren<{
  scroll?: boolean;
  backgroundColor?: string;
  contentStyle?: object;
  className?: string;
  contentClassName?: string;
}>;

export function Screen({
  children,
  scroll = true,
  backgroundColor = '#121212',
  contentStyle,
  className,
  contentClassName,
}: ScreenProps) {
  const scrollContentClasses = `flex-grow px-4 py-4 ${contentClassName ?? ''}`.trim();
  const staticContentClasses = `flex-1 px-4 py-4 ${contentClassName ?? ''}`.trim();

  const content = scroll ? (
    <ScrollView
      className={className}
      contentContainerClassName={scrollContentClasses}
      contentContainerStyle={[{ backgroundColor }, contentStyle]}>
      {children}
    </ScrollView>
  ) : (
    <View className={staticContentClasses} style={[{ backgroundColor }, contentStyle]}>
      {children}
    </View>
  );

  return (
    <SafeAreaView className={`flex-1 ${className ?? ''}`.trim()} style={{ backgroundColor }}>
      {content}
    </SafeAreaView>
  );
}
