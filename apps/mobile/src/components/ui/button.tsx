import type { PropsWithChildren } from 'react';
import { ActivityIndicator, Pressable, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

type ButtonProps = PropsWithChildren<{
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  fullWidth?: boolean;
  className?: string;
  textClassName?: string;
}>;

export function Button({
  children,
  onPress,
  disabled,
  loading,
  variant = 'primary',
  fullWidth = true,
  className,
  textClassName,
}: ButtonProps) {
  const content = loading ? (
    <ActivityIndicator color={variant === 'ghost' ? '#161616' : '#ffffff'} />
  ) : (
    <Text className={`text-base font-bold ${variant === 'ghost' ? 'text-dark' : 'text-primary'} ${textClassName ?? ''}`.trim()}>
      {children}
    </Text>
  );

  if (variant === 'primary') {
    return (
      <Pressable
        className={`${fullWidth ? 'self-stretch' : ''} overflow-hidden rounded-full ${disabled || loading ? 'opacity-[0.55]' : ''} ${className ?? ''}`.trim()}
        disabled={disabled || loading}
        onPress={onPress}>
        <LinearGradient
          colors={['#7c3aed', '#a855f7']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          className="min-h-[58px] items-center justify-center px-5"
          style={{ borderRadius: 999 }}>
          {content}
        </LinearGradient>
      </Pressable>
    );
  }

  const variantClasses = {
    secondary: 'bg-panel',
    ghost: 'bg-ghost-bg',
    outline: 'border border-brand bg-transparent',
  }[variant];

  return (
    <Pressable
      className={`min-h-[58px] items-center justify-center rounded-full px-5 ${fullWidth ? 'self-stretch' : ''} ${variantClasses ?? ''} ${disabled || loading ? 'opacity-[0.55]' : ''} ${className ?? ''}`.trim()}
      disabled={disabled || loading}
      onPress={onPress}>
      {content}
    </Pressable>
  );
}
