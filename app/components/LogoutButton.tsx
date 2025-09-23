import React from 'react';
import { Text, StyleSheet, TouchableOpacity } from 'react-native';

interface LogoutButtonProps {
  onPress: () => void;
  isLoading: boolean;
}

export const LogoutButton: React.FC<LogoutButtonProps> = ({ onPress, isLoading }) => {
  return (
    <TouchableOpacity
      style={styles.logoutButton}
      onPress={onPress}
      disabled={isLoading}
    >
      <Text style={styles.logoutText}>
        {isLoading ? 'Signing Out...' : 'Sign Out'}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  logoutButton: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
  },
});

export default LogoutButton;