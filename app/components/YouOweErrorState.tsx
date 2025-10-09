import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '@/app/context/ThemeContext';

interface YouOweErrorStateProps {
  error: string;
  onRetry: () => void;
}

export default function YouOweErrorState({ error, onRetry }: YouOweErrorStateProps) {
  const { theme } = useTheme();

  return (
    <View style={{
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    }}>
      <Text style={{
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 20,
        color: theme.error,
      }}>
        {error}
      </Text>
      <TouchableOpacity
        style={{
          paddingHorizontal: 24,
          paddingVertical: 12,
          borderRadius: 8,
          backgroundColor: theme.primary,
        }}
        onPress={onRetry}
      >
        <Text style={{
          color: 'white',
          fontSize: 16,
          fontWeight: '600',
        }}>
          Retry
        </Text>
      </TouchableOpacity>
    </View>
  );
}