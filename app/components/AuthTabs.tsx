import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface AuthTabsProps {
  isLogin: boolean;
  onTabChange: (isLogin: boolean) => void;
  disabled?: boolean;
}

export default function AuthTabs({ isLogin, onTabChange, disabled = false }: AuthTabsProps) {
  const { theme } = useTheme();
  const slideAnim = useRef(new Animated.Value(isLogin ? 0 : 1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const screenWidth = Dimensions.get('window').width;
  const tabWidth = (screenWidth - 48) / 2; // Two tabs, 24px padding on each side

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: isLogin ? 0 : 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 200,
        friction: 10,
      }),
    ]).start();
  }, [isLogin, slideAnim, scaleAnim]);

  const handleTabPress = (loginMode: boolean) => {
    if (disabled) return;

    // Add press animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onTabChange(loginMode);
    });
  };

  const styles = getStyles(theme, tabWidth);

  return (
    <View style={[styles.tabContainer, { backgroundColor: theme.surfaceSecondary }]}>
      <Animated.View
        style={[
          styles.slider,
          {
            backgroundColor: theme.surface,
            transform: [
              {
                translateX: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [6, tabWidth + 6], // Move from left position to right position
                }),
              },
              { scale: scaleAnim },
            ],
          },
        ]}
      />
      <TouchableOpacity
        style={[styles.tab, isLogin && styles.activeTab]}
        onPress={() => handleTabPress(true)}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <Text style={[styles.tabText, isLogin && [styles.activeTabText, { color: theme.primary }]]}>
          Login
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, !isLogin && styles.activeTab]}
        onPress={() => handleTabPress(false)}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <Text style={[styles.tabText, !isLogin && [styles.activeTabText, { color: theme.primary }]]}>
          Sign Up
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const getStyles = (theme: any, tabWidth: number) => StyleSheet.create({
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
  slider: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: tabWidth - 12, // Subtract padding
    height: '100%',
    borderRadius: 12,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
    zIndex: 1,
  },
  activeTab: {
    backgroundColor: 'transparent', // Remove background since slider handles it
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