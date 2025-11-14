import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme, hexToRgba } from '@/app/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

interface YouOweSummaryProps {
  totalOwed: number;
  settlementCount: number;
  onViewHistory?: () => void;
}

export default function YouOweSummary({ totalOwed, settlementCount, onViewHistory }: YouOweSummaryProps) {
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
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        marginBottom: 16,
      }}>
        <Text style={{
          fontSize: 16,
          marginBottom: 0,
          color: theme.text,
        }}>
          Total Amount Owed
        </Text>
        {onViewHistory && (
          <TouchableOpacity
            onPress={onViewHistory}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              backgroundColor: hexToRgba(theme.primary, 0.2),
              borderRadius: 6,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <Ionicons name="time-outline" size={14} color={theme.primary} />
            <Text style={{
              fontSize: 12,
              color: theme.primary,
              marginLeft: 4,
              fontWeight: '500',
            }}>
              History
            </Text>
          </TouchableOpacity>
        )}
      </View>

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