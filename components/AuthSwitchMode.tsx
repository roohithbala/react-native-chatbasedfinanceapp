import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

interface AuthSwitchModeProps {
  isLogin: boolean;
  isLoading: boolean;
  onSwitchMode: () => void;
}

export const AuthSwitchMode: React.FC<AuthSwitchModeProps> = ({
  isLogin,
  isLoading,
  onSwitchMode
}) => {
  return (
    <TouchableOpacity
      style={styles.switchModeButton}
      onPress={onSwitchMode}
      disabled={isLoading}
      activeOpacity={0.6}
    >
      <Text style={styles.switchModeText}>
        {isLogin ? "New to SecureFinance? " : "Already have an account? "}
        <Text style={styles.switchModeLink}>
          {isLogin ? 'Create Account' : 'Sign In'}
        </Text>
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  switchModeButton: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  switchModeText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
  switchModeLink: {
    color: '#6366f1',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});