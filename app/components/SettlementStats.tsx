import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

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
  return (
    <View style={styles.statsContainer}>
      <View style={styles.statCard}>
        <Text style={styles.statLabel}>Awaiting</Text>
        <Text style={styles.statValue}>{stats.awaiting}</Text>
        <Text style={styles.statAmount}>₹{stats.totalAwaiting.toFixed(2)}</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statLabel}>Settled</Text>
        <Text style={styles.statValue}>{stats.settled}</Text>
        <Text style={styles.statAmount}>₹{stats.totalSettled.toFixed(2)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginBottom: 4,
  },
  statValue: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statAmount: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    fontWeight: '600',
  },
});