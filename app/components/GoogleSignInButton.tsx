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
      const googleAuth = googleAuthService.getInstance();
      const result = await googleAuth.signIn();
      if (result.type === 'success' && result.params?.id_token) {
        onSuccess(result.params.id_token);
      } else {
        onError(result.params?.error || result.errorCode || 'Google sign-in failed');
      }
    } catch (error: any) {
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