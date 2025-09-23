import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

interface CommandHelperProps {
  onSplitBillPress: () => void;
  onAddExpensePress: () => void;
  onPredictPress: () => void;
  onSummaryPress: () => void;
}

export default function CommandHelper({
  onSplitBillPress,
  onAddExpensePress,
  onPredictPress,
  onSummaryPress,
}: CommandHelperProps) {
  return (
    <View style={styles.commandHelper}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <TouchableOpacity
          style={styles.commandChip}
          onPress={onSplitBillPress}
        >
          <Text style={styles.commandChipText}>💰 Split Bill</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.commandChip}
          onPress={onAddExpensePress}
        >
          <Text style={styles.commandChipText}>@addexpense</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.commandChip}
          onPress={onPredictPress}
        >
          <Text style={styles.commandChipText}>@predict</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.commandChip}
          onPress={onSummaryPress}
        >
          <Text style={styles.commandChipText}>@summary</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  commandHelper: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  commandChip: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  commandChipText: {
    color: '#2563EB',
    fontSize: 12,
    fontWeight: '500',
  },
});