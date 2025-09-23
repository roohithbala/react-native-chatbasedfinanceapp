import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import SettlementStats from './SettlementStats';

interface SettlementStatsData {
  awaiting: number;
  settled: number;
  totalAwaiting: number;
  totalSettled: number;
}

interface SettlementHeaderProps {
  stats: SettlementStatsData;
}

export default function SettlementHeader({ stats }: SettlementHeaderProps) {
  return (
    <LinearGradient colors={['#8B5CF6', '#7C3AED']} style={styles.header}>
      <Text style={styles.headerTitle}>💰 Settlement Tracker</Text>
      <Text style={styles.headerSubtitle}>Track your split bill payments</Text>
      <SettlementStats stats={stats} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 20,
  },
});