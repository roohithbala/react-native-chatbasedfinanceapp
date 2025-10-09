import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '@/app/context/ThemeContext';

interface YouOweSummaryProps {
  totalOwed: number;
  settlementCount: number;
}

export default function YouOweSummary({ totalOwed, settlementCount }: YouOweSummaryProps) {
  const { theme } = useTheme();

  return (
    <View style={{
      padding: 20,
      borderRadius: 12,
      borderWidth: 1,
      marginBottom: 24,
      alignItems: 'center',
      backgroundColor: theme.surface,
      borderColor: theme.border,
    }}>
      <Text style={{
        fontSize: 16,
        marginBottom: 8,
        color: theme.text,
      }}>
        Total Amount Owed
      </Text>
      <Text style={{
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 4,
        color: theme.error,
      }}>
        {theme.currency}{totalOwed.toFixed(2)}
      </Text>
      <Text style={{
        fontSize: 14,
        color: theme.textSecondary,
      }}>
        Across {settlementCount} settlement{settlementCount !== 1 ? 's' : ''}
      </Text>
    </View>
  );
}