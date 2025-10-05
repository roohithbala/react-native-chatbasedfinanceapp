import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface AuthTabsProps {
  isLogin: boolean;
  onTabChange: (isLogin: boolean) => void;
  disabled?: boolean;
}

export default function AuthTabs({ isLogin, onTabChange, disabled = false }: AuthTabsProps) {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  return (
    <View style={[styles.tabContainer, { backgroundColor: theme.surfaceSecondary }]}>
      <TouchableOpacity
        style={[styles.tab, isLogin && [styles.activeTab, { backgroundColor: theme.surface }]]}
        onPress={() => onTabChange(true)}
        disabled={disabled}
      >
        <Text style={[styles.tabText, isLogin && [styles.activeTabText, { color: theme.primary }]]}>
          Login
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, !isLogin && [styles.activeTab, { backgroundColor: theme.surface }]]}
        onPress={() => onTabChange(false)}
        disabled={disabled}
      >
        <Text style={[styles.tabText, !isLogin && [styles.activeTabText, { color: theme.primary }]]}>
          Sign Up
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 6,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    backgroundColor: theme.surfaceSecondary,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
  },
  activeTab: {
    backgroundColor: theme.surface,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textSecondary,
  },
  activeTabText: {
    color: theme.primary,
    fontWeight: '700',
  },
});