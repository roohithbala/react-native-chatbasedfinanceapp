import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import GoogleSignInButton from './GoogleSignInButton';

interface SocialAuthProps {
  onGoogleSignIn: (idToken: string) => void;
  onGoogleError: (error: string) => void;
  disabled?: boolean;
}

export default function SocialAuth({ onGoogleSignIn, onGoogleError, disabled = false }: SocialAuthProps) {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  return (
    <View style={styles.socialAuthContainer}>
      <View style={styles.dividerContainer}>
        <View style={styles.divider} />
        <Text style={styles.dividerText}>or</Text>
        <View style={styles.divider} />
      </View>

      <GoogleSignInButton
        onSuccess={onGoogleSignIn}
        onError={onGoogleError}
        disabled={disabled}
      />
    </View>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  socialAuthContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
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