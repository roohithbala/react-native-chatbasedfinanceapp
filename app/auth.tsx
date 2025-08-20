import React from 'react';
import { useFinanceStore } from '@/lib/store/financeStore';
import { Redirect } from 'expo-router';
import AuthScreen from './components/AuthScreen';

export default function Auth() {
  const { isAuthenticated } = useFinanceStore();

  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  return <AuthScreen />;
}