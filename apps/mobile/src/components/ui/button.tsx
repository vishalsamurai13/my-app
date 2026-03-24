import type { PropsWithChildren } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

type ButtonProps = PropsWithChildren<{
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost';
}>;

export function Button({
  children,
  onPress,
  disabled,
  loading,
  variant = 'primary',
}: ButtonProps) {
  const containerStyles = {
    primary: styles.primaryContainer,
    secondary: styles.secondaryContainer,
    ghost: styles.ghostContainer,
  };

  const textStyles = {
    primary: styles.lightText,
    secondary: styles.lightText,
    ghost: styles.darkText,
  };

  return (
    <Pressable
      style={[styles.base, containerStyles[variant], disabled || loading ? styles.disabled : null]}
      disabled={disabled || loading}
      onPress={onPress}>
      {loading ? (
        <ActivityIndicator color={variant === 'ghost' ? '#101418' : '#ffffff'} />
      ) : (
        <Text style={[styles.label, textStyles[variant]]}>{children}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    paddingHorizontal: 16,
  },
  primaryContainer: {
    backgroundColor: '#d65a31',
  },
  secondaryContainer: {
    backgroundColor: '#345c4d',
  },
  ghostContainer: {
    backgroundColor: '#e6dccd',
  },
  disabled: {
    opacity: 0.6,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  lightText: {
    color: '#ffffff',
  },
  darkText: {
    color: '#101418',
  },
});
