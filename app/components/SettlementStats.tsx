import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface SettlementStatsData {
  awaiting: number;
  settled: number;
  totalAwaiting: number;
  totalSettled: number;
}

interface SettlementStatsProps {
  stats: SettlementStatsData;
}

export default function SettlementStats({ stats }: SettlementStatsProps) {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  return (
    <View style={styles.statsContainer}>
      <View style={styles.statCard}>
        <Text style={styles.statLabel}>Awaiting</Text>
        <Text style={styles.statValue}>{stats.awaiting}</Text>
        <Text style={styles.statAmount}>{theme.currency}{stats.totalAwaiting.toFixed(2)}</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statLabel}>Settled</Text>
        <Text style={styles.statValue}>{stats.settled}</Text>
        <Text style={styles.statAmount}>{theme.currency}{stats.totalSettled.toFixed(2)}</Text>
      </View>
    </View>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.surface + '40', // 40% opacity
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statLabel: {
    color: theme.surfaceSecondary,
    fontSize: 14,
    marginBottom: 4,
  },
  statValue: {
    color: theme.surface,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statAmount: {
    color: theme.surfaceSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
});