import '../global.css';

import { ClerkProvider } from '@clerk/expo';
import { tokenCache } from '@clerk/expo/token-cache';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { queryClient } from '@/lib/query/client';
import { CLERK_PUBLISHABLE_KEY } from '@/constants/config';

WebBrowser.maybeCompleteAuthSession();

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} tokenCache={tokenCache}>
        <QueryClientProvider client={queryClient}>
          <BottomSheetModalProvider>
            <StatusBar style="light" />
            <Stack
              screenOptions={{
                headerShown: false,
                animation: 'fade',
                contentStyle: {
                  backgroundColor: '#121212',
                },
              }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="welcome" />
              <Stack.Screen name="sign-in" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="create" />
              <Stack.Screen name="results/[jobId]" />
            </Stack>
          </BottomSheetModalProvider>
        </QueryClientProvider>
      </ClerkProvider>
    </GestureHandlerRootView>
  );
}
