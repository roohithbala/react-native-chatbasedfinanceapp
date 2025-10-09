import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function GroupStatsLoading() {
  const { theme } = useTheme();

  return (
    <View style={{
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: 16,
    }}>
      <ActivityIndicator size="large" color={theme.primary} />
      <Text style={{
        fontSize: 16,
        color: theme.textSecondary,
        marginTop: 8,
      }}>
        Checking group...
      </Text>
    </View>
  );
}