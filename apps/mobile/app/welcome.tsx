import { LinearGradient } from 'expo-linear-gradient';
import { useAuth, useUser } from '@clerk/expo';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, ImageBackground, Pressable, Text, View } from 'react-native';
import { Button } from '@/components/ui/button';

function WelcomeBackground({ children }: { children?: React.ReactNode }) {
  return (
    <View className="flex-1 bg-app-alt">
      <ImageBackground source={require('../assets/images/bg.png')} resizeMode="cover" style={{ flex: 1 }}>
        <LinearGradient
          colors={['rgba(10,10,15,0.08)', 'rgba(10,10,15,0.94)']}
          style={{ flex: 1, justifyContent: 'flex-end', padding: 18 }}>
          {children}
        </LinearGradient>
      </ImageBackground>
    </View>
  );
}

export default function WelcomeScreen() {
  const router = useRouter();
  const { isLoaded: isAuthLoaded, isSignedIn } = useAuth();
  const { user, isLoaded: isUserLoaded } = useUser();
  const hasResolvedAuth = isAuthLoaded && isUserLoaded;
  const showSignedInState = hasResolvedAuth && Boolean(isSignedIn);
  const guestCardOpacity = useRef(new Animated.Value(0)).current;
  const guestCardTranslate = useRef(new Animated.Value(24)).current;
  const orbScale = useRef(new Animated.Value(0.92)).current;
  const orbOpacity = useRef(new Animated.Value(0)).current;
  const greetingOpacity = useRef(new Animated.Value(0)).current;
  const redirectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const signedInName = useMemo(() => {
    const fullName = user?.fullName?.trim();
    if (fullName) return fullName;

    const nameParts = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim();
    if (nameParts) return nameParts;

    return 'Creator';
  }, [user?.firstName, user?.fullName, user?.lastName]);

  useEffect(() => {
    if (!hasResolvedAuth) {
      return;
    }

    if (redirectTimeoutRef.current) {
      clearTimeout(redirectTimeoutRef.current);
      redirectTimeoutRef.current = null;
    }

    if (showSignedInState) {
      guestCardOpacity.stopAnimation();
      guestCardTranslate.stopAnimation();
      guestCardOpacity.setValue(0);
      guestCardTranslate.setValue(24);

      orbOpacity.setValue(0);
      greetingOpacity.setValue(0);
      orbScale.setValue(0.92);

      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(orbScale, {
            toValue: 1.05,
            duration: 950,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(orbScale, {
            toValue: 0.92,
            duration: 950,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );

      Animated.parallel([
        Animated.timing(orbOpacity, {
          toValue: 0.92,
          duration: 280,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(greetingOpacity, {
          toValue: 1,
          duration: 320,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();

      pulse.start();
      redirectTimeoutRef.current = setTimeout(() => {
        router.replace('/(tabs)' as never);
      }, 1500);

      return () => {
        pulse.stop();
        if (redirectTimeoutRef.current) {
          clearTimeout(redirectTimeoutRef.current);
          redirectTimeoutRef.current = null;
        }
      };
    }

    orbOpacity.stopAnimation();
    greetingOpacity.stopAnimation();
    orbOpacity.setValue(0);
    greetingOpacity.setValue(0);

    guestCardOpacity.setValue(0);
    guestCardTranslate.setValue(24);
    Animated.parallel([
      Animated.timing(guestCardOpacity, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(guestCardTranslate, {
        toValue: 0,
        duration: 420,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();

    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
        redirectTimeoutRef.current = null;
      }
    };
  }, [
    greetingOpacity,
    guestCardOpacity,
    guestCardTranslate,
    hasResolvedAuth,
    orbOpacity,
    orbScale,
    router,
    showSignedInState,
  ]);

  if (!hasResolvedAuth) {
    return <WelcomeBackground />;
  }

  return (
    <WelcomeBackground>
      {showSignedInState ? (
        <View className="flex-1 items-center justify-center">
          <Animated.View style={{ opacity: greetingOpacity }} className="items-center gap-5">
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
            <View className="items-center gap-1.5">
              <Text className="text-center text-[36px] font-extrabold tracking-[0.5px] text-primary">
                Welcome Back!
              </Text>
              <Text className="text-center text-[24px] font-semibold text-secondary">{signedInName}</Text>
            </View>
          </Animated.View>
        </View>
      ) : (
        <Animated.View
          className="rounded-xl4 px-3 pb-3"
          style={{
            opacity: guestCardOpacity,
            transform: [{ translateY: guestCardTranslate }],
          }}>
          <Text className="mb-3 text-center text-[32px] font-extrabold tracking-[1px] leading-[44px] text-primary">
            Experience the Future of AI-Powered Imagery
          </Text>
          <Text className="mb-7 text-center text-[17px] leading-6 text-secondary">
            Enhance and transform visuals effortlessly with smart AI-powered tools.
          </Text>
          <Button onPress={() => router.replace('/(tabs)' as never)}>
            <Text className="text-xl">Try it out</Text>
          </Button>
          <Pressable onPress={() => router.push('/sign-in' as never)} className="mt-[18px] items-center">
            <Text className="text-lg text-muted">
              Already have an account? <Text className="font-bold text-primary underline">Sign In</Text>
            </Text>
          </Pressable>
        </Animated.View>
      )}
    </WelcomeBackground>
  );
}
