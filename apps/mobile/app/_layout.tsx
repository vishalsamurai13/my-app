import '../global.css';

import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { queryClient } from '@/lib/query/client';
import { useAppStore } from '@/lib/store/app-store';
import { getOrCreateDeviceId } from '@/lib/store/device-id';

export default function RootLayout() {
  const deviceId = useAppStore((state) => state.deviceId);
  const setDeviceId = useAppStore((state) => state.setDeviceId);

  useEffect(() => {
    if (deviceId) {
      return;
    }

    void getOrCreateDeviceId().then(setDeviceId);
  }, [deviceId, setDeviceId]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: {
              backgroundColor: '#f5f0e8',
            },
          }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="preview" />
          <Stack.Screen name="results/[jobId]" />
          <Stack.Screen name="history" />
        </Stack>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
