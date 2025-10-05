import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '../context/ThemeContext';

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
  const { theme } = useTheme();
  const styles = getStyles(theme);
  return (
    <View style={styles.commandHelper}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <TouchableOpacity
          style={styles.commandChip}
          onPress={onSplitBillPress}
        >
          <Text style={styles.commandChipText}>@split dinner $100 @all</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.commandChip}
          onPress={onAddExpensePress}
        >
          <Text style={styles.commandChipText}>@addexpense coffee 50</Text>
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

const getStyles = (theme: any) => StyleSheet.create({
  commandHelper: {
    backgroundColor: theme.surface,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  commandChip: {
    backgroundColor: theme.surfaceSecondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  commandChipText: {
    color: theme.primary,
    fontSize: 12,
    fontWeight: '500',
  },
});