import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

interface BiometricAuthProps {
  biometricEnabled: boolean;
  biometricType: 'fingerprint' | 'facial' | 'iris' | null;
  onBiometricLogin: () => void;
  disabled?: boolean;
}

export default function BiometricAuth({
  biometricEnabled,
  biometricType,
  onBiometricLogin,
  disabled = false
}: BiometricAuthProps) {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  if (!biometricEnabled) return null;

  return (
    <View style={styles.biometricContainer}>
      <TouchableOpacity
        style={styles.biometricButton}
        onPress={onBiometricLogin}
        disabled={disabled}
      >
        <LinearGradient
          colors={[theme.success, theme.success]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.biometricGradient}
        >
          <Ionicons
            name={biometricType === 'fingerprint' ? 'finger-print' : biometricType === 'facial' ? 'person' : 'eye'}
            size={24}
            color={theme.text}
          />
          <Text style={[styles.biometricText, { color: theme.text }]}>
            {biometricType === 'fingerprint' ? 'Use Fingerprint' :
             biometricType === 'facial' ? 'Use Face ID' :
             biometricType === 'iris' ? 'Use Iris' : 'Use Biometric'}
          </Text>
        </LinearGradient>
      </TouchableOpacity>

      <View style={styles.dividerContainer}>
        <View style={styles.divider} />
        <Text style={styles.dividerText}>or</Text>
        <View style={styles.divider} />
      </View>
    </View>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  biometricContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  biometricButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: theme.success,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  biometricGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 12,
  },
  biometricText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    letterSpacing: 0.5,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    width: '100%',
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: theme.border,
  },
  dividerText: {
    paddingHorizontal: 16,
    color: theme.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
});