import { useState, useEffect } from 'react';
import { biometricService } from '../lib/services/biometricService';
import { useTheme } from '../app/context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useProfileSettings = () => {
  const { themeMode, setThemeMode } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [biometric, setBiometric] = useState(false);
  const [autoSync, setAutoSync] = useState(true);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);

        // Load biometric availability
        const biometricCheck = await biometricService.isBiometricAvailable();
        setBiometricAvailable(biometricCheck.available);

        // Load saved settings
        const [
          savedNotifications,
          savedBiometric,
          savedAutoSync,
        ] = await AsyncStorage.multiGet([
          'settings_notifications',
          'settings_biometric',
          'settings_auto_sync',
        ]);

        setNotifications(savedNotifications[1] !== 'false');
        setBiometric(savedBiometric[1] === 'true' && biometricCheck.available);
        setAutoSync(savedAutoSync[1] !== 'false');

        // If biometric was enabled but is no longer available, disable it
        if (savedBiometric[1] === 'true' && !biometricCheck.available) {
          await biometricService.disableBiometric();
        }

      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Save settings when they change
  const saveSetting = async (key: string, value: string | boolean) => {
    try {
      await AsyncStorage.setItem(key, value.toString());
    } catch (error) {
      console.error(`Error saving setting ${key}:`, error);
    }
  };

  const handleNotificationsToggle = async (value: boolean) => {
    setNotifications(value);
    await saveSetting('settings_notifications', value);
  };

  const handleBiometricToggle = async (value: boolean) => {
    if (value) {
      // Enable biometric - requires authentication
      const result = await biometricService.enableBiometric();
      if (result.success) {
        setBiometric(true);
        await saveSetting('settings_biometric', true);
      } else {
        // Show error or keep disabled
        console.error('Failed to enable biometric:', result.error);
      }
    } else {
      // Disable biometric
      await biometricService.disableBiometric();
      setBiometric(false);
      await saveSetting('settings_biometric', false);
    }
  };

  const handleThemeToggle = async (value: boolean) => {
    // value represents dark mode enabled/disabled
    const newMode = value ? 'dark' : 'light';
    await setThemeMode(newMode);
  };

  const handleAutoSyncToggle = async (value: boolean) => {
    setAutoSync(value);
    await saveSetting('settings_auto_sync', value);
  };

  const settingsItems = [
    {
      title: 'Push Notifications',
      subtitle: 'Receive alerts for budgets and expenses',
      value: notifications,
      onToggle: handleNotificationsToggle,
      disabled: false,
    },
    {
      title: 'Biometric Authentication',
      subtitle: biometricAvailable
        ? 'Use fingerprint or face unlock'
        : 'Biometric authentication not available',
      value: biometric,
      onToggle: handleBiometricToggle,
      disabled: !biometricAvailable,
    },
    {
      title: 'Dark Mode',
      subtitle: 'Use dark theme throughout the app',
      value: themeMode === 'dark',
      onToggle: handleThemeToggle,
      disabled: false,
    },
    {
      title: 'Auto Sync',
      subtitle: 'Automatically sync data across devices',
      value: autoSync,
      onToggle: handleAutoSyncToggle,
      disabled: false,
    },
  ];

  return {
    notifications,
    biometric,
    darkMode: themeMode === 'dark',
    autoSync,
    biometricAvailable,
    loading,
    settingsItems,
    themeMode,
  };
};