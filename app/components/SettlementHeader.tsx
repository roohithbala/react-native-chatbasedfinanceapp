import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import SettlementStats from './SettlementStats';
import { useTheme } from '../context/ThemeContext';

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
  const { theme } = useTheme();
  const styles = getStyles(theme);
  return (
    <LinearGradient colors={[theme.primary, theme.primaryDark]} style={styles.header}>
      <Text style={styles.headerTitle}>💰 Settlement Tracker</Text>
      <Text style={styles.headerSubtitle}>Track your split bill payments</Text>
      <SettlementStats stats={stats} />
    </LinearGradient>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
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
    color: theme.surface,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: theme.surfaceSecondary,
    marginBottom: 20,
  },
});