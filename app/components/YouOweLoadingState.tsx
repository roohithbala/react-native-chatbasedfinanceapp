import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '@/app/context/ThemeContext';

export default function YouOweLoadingState() {
  const { theme } = useTheme();

  return (
    <View style={{
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    }}>
      <Text style={{
        fontSize: 16,
        color: theme.textSecondary,
      }}>
        Loading settlement details...
      </Text>
    </View>
  );
}