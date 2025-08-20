import React from 'react';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useFinanceStore } from '@/lib/store/financeStore';

export default function RootLayout() {
  useFrameworkReady();
  const { loadStoredAuth, isAuthenticated } = useFinanceStore();

  useEffect(() => {
    loadStoredAuth();
  }, []);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="auth" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}
