import React, { useEffect } from 'react';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFinanceStore } from '@/lib/store/financeStore';
import { ThemeProvider } from './context/ThemeContext';
import { GroupProvider } from './context/GroupContext';
import CallNotification from './components/CallNotification';
import { router } from 'expo-router';

export default function RootLayout() {
  const { loadStoredAuth, isAuthenticated } = useFinanceStore();

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const handleCallAccept = () => {
    // Navigate to the appropriate call screen
    const { incomingCall } = require('@/lib/store/callStore').useCallStore.getState();
    if (incomingCall) {
      if (incomingCall.type === 'video') {
        router.push(`/video-call/${incomingCall.callerId}`);
      } else {
        router.push(`/voice-call/${incomingCall.callerId}`);
      }
    }
  };

  const handleCallDecline = () => {
    // Call is already declined in the notification component
  };

  return (
    <SafeAreaProvider>
      <GroupProvider>
        <ThemeProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="auth" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="+not-found" />
          </Stack>
          <StatusBar style="auto" />

          {/* Call Notification Overlay */}
          <CallNotification
            onAccept={handleCallAccept}
            onDecline={handleCallDecline}
          />
        </ThemeProvider>
      </GroupProvider>
    </SafeAreaProvider>
  );
}
