import type { PropsWithChildren } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';

export function SectionCard({
  children,
  backgroundColor = '#1a1423',
  borderColor = '#2b2340',
  className,
  style,
}: PropsWithChildren<{
  backgroundColor?: string;
  borderColor?: string;
  className?: string;
  // Allows callers to pass arbitrary RN styles (e.g. minHeight, overflow)
  style?: StyleProp<ViewStyle>;
}>) {
  return (
    <View
      className={`rounded-xl border p-4 ${className ?? ''}`.trim()}
      style={[{ backgroundColor, borderColor }, style]}
    >
      {children}
    </View>
  );
}