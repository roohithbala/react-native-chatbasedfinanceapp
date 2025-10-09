import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '@/app/context/ThemeContext';
import { SettlementPlan } from '@/lib/services/paymentsAPI';

interface SettlementCardProps {
  settlement: SettlementPlan;
  onSettlePayment: (settlement: SettlementPlan) => void;
}

export default function SettlementCard({ settlement, onSettlePayment }: SettlementCardProps) {
  const { theme } = useTheme();

  return (
    <View style={{
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      marginBottom: 12,
      backgroundColor: theme.surface,
      borderColor: theme.border,
    }}>
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
      }}>
        <View style={{
          flex: 1,
        }}>
          <Text style={{
            fontSize: 16,
            fontWeight: '600',
            marginBottom: 4,
            color: theme.text,
          }}>
            To: {settlement.toUserName}
          </Text>
          <Text style={{
            fontSize: 18,
            fontWeight: 'bold',
            color: theme.error,
          }}>
            {theme.currency}{settlement.amount.toFixed(2)}
          </Text>
        </View>
      </View>

      <View style={{
        flexDirection: 'row',
        justifyContent: 'flex-end',
      }}>
        <TouchableOpacity
          style={{
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 6,
            backgroundColor: theme.primary,
          }}
          onPress={() => onSettlePayment(settlement)}
        >
          <Text style={{
            color: 'white',
            fontSize: 14,
            fontWeight: '600',
          }}>
            Mark as Paid
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}