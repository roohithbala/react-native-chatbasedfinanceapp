import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface RecurringExpenseToggleProps {
  isRecurring: boolean;
  onToggle: () => void;
  frequency: string;
  onFrequencyChange: (frequency: string) => void;
}

const recurringOptions = ['daily', 'weekly', 'monthly', 'yearly'];

export default function RecurringExpenseToggle({
  isRecurring,
  onToggle,
  frequency,
  onFrequencyChange
}: RecurringExpenseToggleProps) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>🔄 Recurring Expense</Text>
      <TouchableOpacity
        style={styles.toggleContainer}
        onPress={onToggle}
      >
        <View style={[styles.toggle, isRecurring && styles.toggleActive]}>
          <View style={[styles.toggleCircle, isRecurring && styles.toggleCircleActive]} />
        </View>
        <Text style={styles.toggleText}>
          {isRecurring ? 'Yes' : 'No'}
        </Text>
      </TouchableOpacity>
      {isRecurring && (
        <View style={styles.recurringOptions}>
          {recurringOptions.map((freq) => (
            <TouchableOpacity
              key={freq}
              style={[
                styles.freqChip,
                frequency === freq && styles.freqChipActive,
              ]}
              onPress={() => onFrequencyChange(freq)}
            >
              <Text
                style={[
                  styles.freqText,
                  frequency === freq && styles.freqTextActive,
                ]}
              >
                {freq.charAt(0).toUpperCase() + freq.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
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
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E2E8F0',
    marginRight: 12,
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: '#10B981',
  },
  toggleCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'white',
    marginLeft: 2,
  },
  toggleCircleActive: {
    marginLeft: 24,
  },
  toggleText: {
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '600',
  },
  recurringOptions: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  freqChip: {
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  freqChipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  freqText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  freqTextActive: {
    color: 'white',
  },
});