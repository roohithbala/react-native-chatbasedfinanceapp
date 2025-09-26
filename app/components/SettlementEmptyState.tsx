import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

interface SettlementEmptyStateProps {
  activeTab: 'awaiting' | 'settled';
}

export default function SettlementEmptyState({ activeTab }: SettlementEmptyStateProps) {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  return (
    <View style={styles.emptyState}>
      <Ionicons
        name={activeTab === 'awaiting' ? 'time-outline' : 'checkmark-circle-outline'}
        size={64}
        color={theme.textTertiary}
      />
      <Text style={styles.emptyTitle}>
        {activeTab === 'awaiting' ? 'No pending payments' : 'No settled bills'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {activeTab === 'awaiting'
          ? 'All your split bills are settled!'
          : 'Your settled bills will appear here'
        }
      </Text>
    </View>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  emptyState: {
    alignItems: 'center',
    padding: 40,
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.textSecondary,
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.textTertiary,
    marginTop: 8,
    textAlign: 'center',
  },
});