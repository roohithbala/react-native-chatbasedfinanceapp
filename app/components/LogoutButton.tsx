import React from 'react';
import { Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme, hexToRgba } from '../context/ThemeContext';

interface LogoutButtonProps {
  onPress: () => void;
  isLoading: boolean;
}

export const LogoutButton: React.FC<LogoutButtonProps> = ({ onPress, isLoading }) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);
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

const getStyles = (theme: any) => StyleSheet.create({
  logoutButton: {
    backgroundColor: hexToRgba(theme.error, 0.2), // 20% opacity
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: hexToRgba(theme.error, 0.4), // 40% opacity
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.error,
  },
});

export default LogoutButton;