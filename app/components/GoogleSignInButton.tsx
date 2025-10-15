import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import googleAuthService from '../../lib/services/googleAuthService';

interface GoogleSignInButtonProps {
  onSuccess: (idToken: string) => void;
  onError: (error: string) => void;
  disabled?: boolean;
}

const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onSuccess,
  onError,
  disabled = false,
}) => {
  const handleGoogleSignIn = async () => {
    try {
      console.log('Starting Google sign-in...');
      const googleAuth = googleAuthService.getInstance();

      // Check if configured
      if (!googleAuth.isConfigured()) {
        onError('Google OAuth is not properly configured. Please check your environment variables.');
        return;
      }

      const result = await googleAuth.signIn();
      console.log('Google auth result:', result);

      if (result.type === 'success' && result.params?.id_token) {
        console.log('Google sign-in successful, sending ID token to backend');
        onSuccess(result.params.id_token);
      } else {
        const errorMsg = result.params?.error || result.errorCode || 'Google sign-in failed';
        console.error('Google sign-in failed:', errorMsg);
        onError(errorMsg);
      }
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      onError(error.message || 'Google sign-in failed');
    }
  };

  return (
    <TouchableOpacity
      style={[styles.container, disabled && styles.disabled]}
      onPress={handleGoogleSignIn}
      disabled={disabled}
    >
      <LinearGradient
        colors={['#4285F4', '#34A853']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <Ionicons name="logo-google" size={20} color="#FFFFFF" style={styles.icon} />
          <Text style={styles.text}>Continue with Google</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    marginVertical: 8,
  },
  disabled: {
    opacity: 0.6,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: 12,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default GoogleSignInButton;