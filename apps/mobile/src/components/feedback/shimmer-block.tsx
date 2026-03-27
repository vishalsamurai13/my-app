import { useEffect, useRef, type ReactNode } from 'react';
import { Animated, Easing, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

type ShimmerBlockProps = {
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
};

export function ShimmerBlock({ style, children }: ShimmerBlockProps) {
  const translateX = useRef(new Animated.Value(-220)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(translateX, {
        toValue: 220,
        duration: 1150,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [translateX]);

  return (
    <View className="overflow-hidden rounded-[20px] border border-border-card bg-card" style={style}>
      <View className="absolute inset-0 bg-[#1d1727]" />
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          width: '65%',
          transform: [{ translateX }, { skewX: '-18deg' as never }],
        }}>
        <LinearGradient
          colors={['rgba(255,255,255,0)', 'rgba(231,213,255,0.16)', 'rgba(255,255,255,0)']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={{ flex: 1 }}
        />
      </Animated.View>
      {children ? <View className="flex-1">{children}</View> : null}
    </View>
  );
}
