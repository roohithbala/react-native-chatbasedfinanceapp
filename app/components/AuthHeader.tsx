import React from 'react';
import { View, Text, StyleSheet, Platform, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';

interface AuthHeaderProps {
  isLogin: boolean;
}

export default function AuthHeader({ isLogin }: AuthHeaderProps) {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  return (
    <View style={styles.headerContainer}>
      <LinearGradient
        colors={[theme.primary + '20', theme.primary + '10', 'transparent']}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.logoContainer}>
          <View style={styles.logoIcon}>
            <Text style={styles.logoText}>💰</Text>
          </View>
          <Text style={styles.appName}>ChatFinance</Text>
          <Text style={styles.tagline}>Smart Money, Better Chat</Text>
        </View>

        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeTitle}>
            {isLogin ? 'Welcome Back!' : 'Join the Community'}
          </Text>
          <Text style={styles.welcomeSubtitle}>
            {isLogin
              ? 'Sign in to manage your finances and chat with friends'
              : 'Create your account and start your financial journey'
            }
          </Text>
        </View>

        <View style={styles.decorativeElements}>
          <View style={styles.decorativeCircle1} />
          <View style={styles.decorativeCircle2} />
          <View style={styles.decorativeCircle3} />
        </View>
      </LinearGradient>
    </View>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  headerContainer: {
    paddingTop: Platform.OS === 'ios' ? 20 : 40,
    paddingBottom: 30,
    paddingHorizontal: 20,
    minHeight: 280,
  },
  headerGradient: {
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    minHeight: 240,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  logoText: {
    fontSize: 32,
    textAlign: 'center',
  },
  appName: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.text,
    marginBottom: 4,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 16,
    color: theme.text,
    textAlign: 'center',
    fontWeight: '600',
    opacity: 1,
    letterSpacing: 0.5,
  },
  welcomeContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: theme.text,
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
    maxWidth: Dimensions.get('window').width * 0.8,
    opacity: 0.9,
  },
  decorativeElements: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  decorativeCircle1: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.primary + '15',
  },
  decorativeCircle2: {
    position: 'absolute',
    top: 40,
    left: -30,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.primary + '10',
  },
  decorativeCircle3: {
    position: 'absolute',
    bottom: -10,
    right: 40,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: theme.primary + '08',
  },
});