import React from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface AuthHeaderProps {
  scaleAnim: Animated.Value;
}

export const AuthHeader: React.FC<AuthHeaderProps> = ({ scaleAnim }) => {
  return (
    <Animated.View
      style={[
        styles.headerContainer,
        {
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <View style={styles.logoWrapper}>
        <LinearGradient
          colors={['#ffffff', '#f8fafc']}
          style={styles.logoContainer}
        >
          <MaterialCommunityIcons name="finance" size={40} color="#6366f1" />
        </LinearGradient>
        <View style={styles.logoGlow} />
      </View>

      <Text style={styles.title}>SecureFinance</Text>
      <Text style={styles.subtitle}>
        Smart money management{'\n'}with end-to-end security
      </Text>

      {/* Decorative elements */}
      <View style={styles.decorativeCircles}>
        <View style={[styles.circle, styles.circle1]} />
        <View style={[styles.circle, styles.circle2]} />
        <View style={[styles.circle, styles.circle3]} />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 20 : 40,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  logoWrapper: {
    position: 'relative',
    marginBottom: 24,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  logoGlow: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 60,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: 'white',
    marginBottom: 12,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '400',
  },
  decorativeCircles: {
    position: 'absolute',
    top: 0,
    right: 0,
    left: 0,
    bottom: 0,
  },
  circle: {
    position: 'absolute',
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  circle1: {
    width: 80,
    height: 80,
    top: 20,
    right: 20,
  },
  circle2: {
    width: 60,
    height: 60,
    top: 100,
    left: 30,
  },
  circle3: {
    width: 40,
    height: 40,
    bottom: 40,
    right: 60,
  },
});