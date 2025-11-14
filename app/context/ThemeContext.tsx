// ThemeProvider.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeColors {
  // Backgrounds / Surfaces
  background: string;
  surface: string;
  surfaceSecondary: string;
  card: string;

  // Text
  text: string;
  textSecondary: string;
  textTertiary: string;

  // Primary
  primary: string;
  primaryLight: string;
  primaryDark: string;

  // Status
  success: string;
  warning: string;
  error: string;
  info: string;

  // Borders / shadows
  border: string;
  borderLight: string;
  shadow: string;

  // Tab bar
  tabBarBackground: string;
  tabBarActive: string;
  tabBarInactive: string;

  // Input
  inputBackground: string;
  inputBorder: string;
  inputPlaceholder: string;

  // Modal
  modalBackground: string;
  modalOverlay: string;

  // Currency / misc
  currency: string;
}

/** Utility: convert hex (#RRGGBB or RRGGBB) to rgba() with opacity (0-1) */
export const hexToRgba = (hex: string, opacity: number): string => {
  const cleanHex = hex.replace('#', '');
  if (cleanHex.length !== 6) {
    // fallback to black transparent if invalid
    return `rgba(0,0,0,${opacity})`;
  }
  const r = parseInt(cleanHex.substr(0, 2), 16);
  const g = parseInt(cleanHex.substr(2, 2), 16);
  const b = parseInt(cleanHex.substr(4, 2), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

/** Light theme */
export const lightTheme: ThemeColors = {
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceSecondary: '#F1F5F9',
  card: '#FFFFFF',

  text: '#0F172A',
  textSecondary: '#64748B',
  textTertiary: '#94A3B8',

  primary: '#2563EB',
  primaryLight: '#3B82F6',
  primaryDark: '#1D4ED8',

  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  shadow: 'rgba(0, 0, 0, 0.1)',

  tabBarBackground: '#FFFFFF',
  tabBarActive: '#2563EB',
  tabBarInactive: '#64748B',

  inputBackground: '#FFFFFF',
  inputBorder: '#E2E8F0',
  inputPlaceholder: '#94A3B8',

  modalBackground: '#FFFFFF',
  modalOverlay: 'rgba(0, 0, 0, 0.5)',

  currency: '₹',
};

/** Dark theme */
export const darkTheme: ThemeColors = {
  background: '#0F172A',
  surface: '#1E293B',
  surfaceSecondary: '#334155',
  card: '#1E293B',

  text: '#F8FAFC',
  textSecondary: '#CBD5E1',
  textTertiary: '#94A3B8',

  primary: '#3B82F6',
  primaryLight: '#60A5FA',
  primaryDark: '#2563EB',

  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  border: '#334155',
  borderLight: '#475569',
  shadow: 'rgba(0, 0, 0, 0.3)',

  tabBarBackground: '#1E293B',
  tabBarActive: '#3B82F6',
  tabBarInactive: '#64748B',

  inputBackground: '#334155',
  inputBorder: '#475569',
  inputPlaceholder: '#64748B',

  modalBackground: '#1E293B',
  modalOverlay: 'rgba(0, 0, 0, 0.7)',

  currency: '₹',
};

export interface ThemeContextType {
  theme: ThemeColors;
  themeMode: ThemeMode;
  systemTheme: ColorSchemeName | null;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  toggleTheme: () => Promise<void>;
  light: ThemeColors;
  dark: ThemeColors;
}

const STORAGE_KEY = 'theme_mode';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = (): ThemeContextType => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [systemTheme, setSystemTheme] = useState<ColorSchemeName | null>(Appearance.getColorScheme());

  // load saved mode
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (!mounted) return;
        if (saved === 'light' || saved === 'dark' || saved === 'system') {
          setThemeModeState(saved);
        }
      } catch (e) {
        console.error('Failed to load theme mode', e);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  // listen for system theme changes
  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemTheme(colorScheme);
    });
    return () => {
      // remove listener
      // on modern RN, addChangeListener returns a subscription with remove()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((sub as any)?.remove) (sub as any).remove();
    };
  }, []);

  const getCurrentTheme = (): ThemeColors => {
    if (themeMode === 'light') return lightTheme;
    if (themeMode === 'dark') return darkTheme;
    return systemTheme === 'dark' ? darkTheme : lightTheme;
  };

  const setThemeMode = async (mode: ThemeMode): Promise<void> => {
    try {
      setThemeModeState(mode);
      await AsyncStorage.setItem(STORAGE_KEY, mode);
    } catch (e) {
      console.error('Error saving theme mode', e);
    }
  };

  const toggleTheme = async (): Promise<void> => {
    const newMode: ThemeMode = themeMode === 'light' ? 'dark' : 'light';
    await setThemeMode(newMode);
  };

  const theme = getCurrentTheme();

  const value: ThemeContextType = {
    theme,
    themeMode,
    systemTheme,
    setThemeMode,
    toggleTheme,
    light: lightTheme,
    dark: darkTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export default ThemeProvider;
