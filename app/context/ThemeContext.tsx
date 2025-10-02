import { createContext, useContext, useEffect, useState } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeColors {
  // Background colors
  background: string;
  surface: string;
  surfaceSecondary: string;
  card: string;

  // Text colors
  text: string;
  textSecondary: string;
  textTertiary: string;

  // Primary colors
  primary: string;
  primaryLight: string;
  primaryDark: string;

  // Status colors
  success: string;
  warning: string;
  error: string;
  info: string;

  // Border colors
  border: string;
  borderLight: string;

  // Shadow colors
  shadow: string;

  // Tab bar colors
  tabBarBackground: string;
  tabBarActive: string;
  tabBarInactive: string;

  // Input colors
  inputBackground: string;
  inputBorder: string;
  inputPlaceholder: string;

  // Modal colors
  modalBackground: string;
  modalOverlay: string;

  // Currency
  currency: string;
}

const lightTheme: ThemeColors = {
  background: '#F0F9FF',
  surface: '#FFFFFF',
  surfaceSecondary: '#F1F9FE',
  card: '#FFFFFF',

  text: '#0F172A',
  textSecondary: '#334155',
  textTertiary: '#64748B',

  primary: '#0D9488',
  primaryLight: '#14B8A6',
  primaryDark: '#0F766E',

  success: '#059669',
  warning: '#D97706',
  error: '#DC2626',
  info: '#0891B2',

  border: '#CBD5E1',
  borderLight: '#E2E8F0',

  shadow: 'rgba(13, 148, 136, 0.1)',

  tabBarBackground: '#FFFFFF',
  tabBarActive: '#0D9488',
  tabBarInactive: '#64748B',

  inputBackground: '#FFFFFF',
  inputBorder: '#CBD5E1',
  inputPlaceholder: '#94A3B8',

  modalBackground: '#FFFFFF',
  modalOverlay: 'rgba(15, 23, 42, 0.6)',

  currency: '₹',
};

const darkTheme: ThemeColors = {
  background: '#0F172A',
  surface: '#1E293B',
  surfaceSecondary: '#334155',
  card: '#1E293B',

  text: '#F8FAFC',
  textSecondary: '#CBD5E1',
  textTertiary: '#64748B',

  primary: '#14B8A6',
  primaryLight: '#2DD4BF',
  primaryDark: '#0D9488',

  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#06B6D4',

  border: '#334155',
  borderLight: '#475569',

  shadow: 'rgba(20, 184, 166, 0.2)',

  tabBarBackground: '#1E293B',
  tabBarActive: '#14B8A6',
  tabBarInactive: '#64748B',

  inputBackground: '#334155',
  inputBorder: '#475569',
  inputPlaceholder: '#64748B',

  modalBackground: '#1E293B',
  modalOverlay: 'rgba(15, 23, 42, 0.8)',

  currency: '₹',
};

export interface ThemeContextType {
  theme: ThemeColors;
  themeMode: ThemeMode;
  systemTheme: ColorSchemeName;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  toggleTheme: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [systemTheme, setSystemTheme] = useState<ColorSchemeName>(Appearance.getColorScheme());

  // Load saved theme mode on mount
  useEffect(() => {
    const loadThemeMode = async () => {
      try {
        const savedMode = await AsyncStorage.getItem('theme_mode');
        if (savedMode && ['light', 'dark', 'system'].includes(savedMode)) {
          setThemeModeState(savedMode as ThemeMode);
        }
      } catch (error) {
        console.error('Error loading theme mode:', error);
      }
    };

    loadThemeMode();
  }, []);

  // Listen for system theme changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemTheme(colorScheme);
    });

    return () => subscription?.remove();
  }, []);

  // Determine current theme based on mode
  const getCurrentTheme = (): ThemeColors => {
    if (themeMode === 'light') return lightTheme;
    if (themeMode === 'dark') return darkTheme;

    // System mode
    return systemTheme === 'dark' ? darkTheme : lightTheme;
  };

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      setThemeModeState(mode);
      await AsyncStorage.setItem('theme_mode', mode);
    } catch (error) {
      console.error('Error saving theme mode:', error);
    }
  };

  const toggleTheme = async () => {
    const newMode = themeMode === 'light' ? 'dark' : 'light';
    await setThemeMode(newMode);
  };

  const theme = getCurrentTheme();

  const value: ThemeContextType = {
    theme,
    themeMode,
    systemTheme,
    setThemeMode,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// Export themes for direct access if needed
export { lightTheme, darkTheme };

export default ThemeProvider;