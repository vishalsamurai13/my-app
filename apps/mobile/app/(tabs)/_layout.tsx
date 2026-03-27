import { useEffect, useMemo, useRef, useState } from 'react';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Tabs } from 'expo-router';
import { House, UserRound } from 'lucide-react-native';
import { Animated, Easing, Pressable, Text, View } from 'react-native';

function TabIcon({ routeName, color }: { routeName: string; color: string }) {
  if (routeName === 'profile') {
    return <UserRound color={color} size={20} />;
  }

  return <House color={color} size={20} />;
}

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const [trackWidth, setTrackWidth] = useState(0);
  const indicatorX = useRef(new Animated.Value(0)).current;
  const indicatorScale = useRef(new Animated.Value(1)).current;
  const slotWidth = useMemo(() => (trackWidth > 0 ? trackWidth / state.routes.length : 0), [state.routes.length, trackWidth]);

  useEffect(() => {
    if (!slotWidth) {
      return;
    }

    Animated.parallel([
      Animated.timing(indicatorX, {
        toValue: slotWidth * state.index,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(indicatorScale, {
          toValue: 0.92,
          duration: 110,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.spring(indicatorScale, {
          toValue: 1,
          friction: 7,
          tension: 110,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [indicatorScale, indicatorX, slotWidth, state.index]);

  return (
    <View className="absolute bottom-6 left-4 right-4" pointerEvents="box-none">
      <View className="rounded-full border border-border-card bg-[#222122]/60 px-2 py-2">
        <View
          className="relative h-[56px] flex-row items-center rounded-full"
          onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}>
          {slotWidth ? (
            <Animated.View
              pointerEvents="none"
              className="absolute left-0 top-0 h-[56px] rounded-full bg-brand"
              style={{
                width: slotWidth,
                transform: [{ translateX: indicatorX }, { scale: indicatorScale }],
              }}
            />
          ) : null}
          {state.routes.map((route, index) => {
            const descriptor = descriptors[route.key];
            const options = descriptor.options;
            const isFocused = state.index === index;
            const label =
              typeof options.title === 'string'
                ? options.title
                : typeof options.tabBarLabel === 'string'
                  ? options.tabBarLabel
                  : route.name === 'index'
                    ? 'Home'
                    : 'Profile';

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            return (
              <Pressable
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                testID={options.tabBarButtonTestID}
                onPress={onPress}
                className="h-[56px] flex-1 flex-row items-center justify-center rounded-full">
                <TabIcon routeName={route.name} color="#ffffff" />
                <Animated.View
                  style={{
                    opacity: isFocused ? 1 : 0,
                    transform: [{ translateX: isFocused ? 0 : -8 }],
                  }}>
                  {isFocused ? <Text className="ml-2 text-lg font-bold text-primary">{label}</Text> : null}
                </Animated.View>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        sceneStyle: {
          backgroundColor: '#121212',
        },
        tabBarStyle: {
          display: 'none',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
        }}
      />
    </Tabs>
  );
}
