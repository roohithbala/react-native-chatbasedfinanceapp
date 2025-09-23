import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';

interface PaymentMethodSelectorProps {
  selectedMethod: string;
  onMethodChange: (method: string) => void;
}

const paymentMethods = ['Cash', 'Card', 'Digital Wallet', 'Bank Transfer', 'Other'];

export default function PaymentMethodSelector({ selectedMethod, onMethodChange }: PaymentMethodSelectorProps) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>💳 Payment Method</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
      >
        {paymentMethods.map((method) => (
          <TouchableOpacity
            key={method}
            style={[
              styles.methodChip,
              selectedMethod === method && styles.methodChipActive,
            ]}
            onPress={() => onMethodChange(method)}
          >
            <Text
              style={[
                styles.methodText,
                selectedMethod === method && styles.methodTextActive,
              ]}
            >
              {method}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  categoryScroll: {
    marginTop: 8,
  },
  methodChip: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  methodChipActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  methodText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  methodTextActive: {
    color: 'white',
  },
});