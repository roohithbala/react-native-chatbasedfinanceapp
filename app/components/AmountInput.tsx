import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';

interface AmountInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export default function AmountInput({ value, onChangeText, placeholder = "0.00" }: AmountInputProps) {
  const handleAmountChange = (text: string) => {
    const cleaned = text.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) return;
    if (parts[1] && parts[1].length > 2) return;
    onChangeText(cleaned);
  };

  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>💰 Amount *</Text>
      <TextInput
        style={styles.amountInput}
        value={value}
        onChangeText={handleAmountChange}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        keyboardType="decimal-pad"
        maxLength={10}
      />
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
  amountInput: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    fontSize: 20,
    fontWeight: 'bold',
    borderWidth: 2,
    borderColor: '#10B981',
    color: '#1E293B',
    textAlign: 'center',
  },
});