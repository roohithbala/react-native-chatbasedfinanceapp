import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/app/context/ThemeContext';

export default function YouOweEmptyState() {
  const { theme } = useTheme();

  return (
    <View style={{
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 60,
    }}>
      <Ionicons name="checkmark-circle" size={64} color={theme.success} />
      <Text style={{
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 16,
        marginBottom: 8,
        color: theme.text,
      }}>
        All Settled Up!
      </Text>
      <Text style={{
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 22,
        color: theme.textSecondary,
      }}>
        You don&apos;t owe any money to anyone right now.
      </Text>
    </View>
  );
}