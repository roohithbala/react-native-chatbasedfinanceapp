import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface AuthSubmitButtonProps {
  isLogin: boolean;
  isLoading: boolean;
  onPress: () => void;
}

export const AuthSubmitButton: React.FC<AuthSubmitButtonProps> = ({
  isLogin,
  isLoading,
  onPress
}) => {
  return (
    <TouchableOpacity
      style={styles.submitButton}
      onPress={onPress}
      disabled={isLoading}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={
          isLoading
            ? ['#94a3b8', '#94a3b8']
            : ['#6366f1', '#8b5cf6', '#ec4899']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.submitGradient}
      >
        <Text style={styles.submitText}>
          {isLoading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
        </Text>
        {!isLoading && (
          <Ionicons
            name={isLogin ? 'log-in-outline' : 'person-add-outline'}
            size={20}
            color="white"
            style={styles.submitIcon}
          />
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  submitButton: {
    marginTop: 8,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 8,
  },
  submitText: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    letterSpacing: 0.5,
  },
  submitIcon: {
    marginLeft: 4,
  },
});