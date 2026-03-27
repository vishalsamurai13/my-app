import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Tabs } from 'expo-router';
import { House, UserRound } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

function TabIcon({ routeName, color }: { routeName: string; color: string }) {
  if (routeName === 'profile') {
    return <UserRound color={color} size={20} />;
  }

  return <House color={color} size={20} />;
}

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  return (
    <View className="absolute bottom-6 left-4 right-4" pointerEvents="box-none">
      <View className="rounded-full border border-border-card bg-[#222122]/60" pointerEvents="box-none">
        <View className="flex-row items-center gap-3 rounded-full px-3 py-2" pointerEvents="box-none">
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
                className={`h-[56px] flex-row items-center justify-center rounded-full ${isFocused ? 'flex-1 bg-brand px-5' : 'w-[56px] border border-border-card bg-[#1e1e24]'}`.trim()}>
                <TabIcon routeName={route.name} color="#ffffff" />
                {isFocused ? <Text className="ml-2 text-sm font-bold text-primary">{label}</Text> : null}
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
