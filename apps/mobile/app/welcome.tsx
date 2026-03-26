import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@clerk/expo';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, ImageBackground, Pressable, Text, View } from 'react-native';
import { Button } from '@/components/ui/button';

export default function WelcomeScreen() {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const cardOpacity = useRef(new Animated.Value(isSignedIn ? 0 : 1)).current;
  const cardTranslate = useRef(new Animated.Value(isSignedIn ? 32 : 0)).current;
  const orbScale = useRef(new Animated.Value(0.88)).current;
  const orbOpacity = useRef(new Animated.Value(isSignedIn ? 0.9 : 0)).current;

  useEffect(() => {
    if (isSignedIn) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(orbScale, { toValue: 1.06, duration: 900, useNativeDriver: true }),
          Animated.timing(orbScale, { toValue: 0.9, duration: 900, useNativeDriver: true }),
        ]),
      );

      pulse.start();
      const timeout = setTimeout(() => {
        router.replace('/(tabs)' as never);
      }, 1200);

      return () => {
        pulse.stop();
        clearTimeout(timeout);
      };
    }

    Animated.parallel([
      Animated.timing(cardOpacity, { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.timing(cardTranslate, { toValue: 0, duration: 450, useNativeDriver: true }),
    ]).start();
  }, [cardOpacity, cardTranslate, isSignedIn, orbScale, router]);

  return (
    <View className="flex-1 bg-app-alt">
      <ImageBackground source={require('../assets/images/bg.png')} resizeMode="cover" style={{ flex: 1 }}>
        <LinearGradient
          colors={['rgba(10,10,15,0.08)', 'rgba(10,10,15,0.94)']}
          style={{ flex: 1, justifyContent: 'flex-end', padding: 18 }}>
          {isSignedIn ? (
            <View className="flex-1 items-center justify-center">
              <Animated.View
                className="h-24 w-24 rounded-full bg-white/10"
                style={{
                  opacity: orbOpacity,
                  transform: [{ scale: orbScale }],
                  shadowColor: '#a855f7',
                  shadowOpacity: 0.45,
                  shadowRadius: 26,
                  elevation: 16,
                }}
              />
            </View>
          ) : (
            <Animated.View
              className="rounded-xl4 px-3 pb-3"
              style={{
                opacity: cardOpacity,
                transform: [{ translateY: cardTranslate }],
              }}>
              <Text className="mb-3 text-center text-[32px] font-extrabold tracking-[1px] leading-[44px] text-primary">
                Experience the Future of AI-Powered Imagery
              </Text>
              <Text className="mb-7 text-center text-[17px] leading-6 text-secondary">
                Enhance and transform visuals effortlessly with smart AI-powered tools.
              </Text>
              <Button onPress={() => router.replace('/(tabs)' as never)}>
                <Text className='text-xl'>Try it out</Text>
              </Button>
              <Pressable onPress={() => router.push('/sign-in' as never)} className="mt-[18px] items-center">
                <Text className="text-lg text-muted">
                  Already have an account? <Text className="font-bold text-primary underline">Sign In</Text>
                </Text>
              </Pressable>
            </Animated.View>
          )}
        </LinearGradient>
      </ImageBackground>
    </View>
  );
}
