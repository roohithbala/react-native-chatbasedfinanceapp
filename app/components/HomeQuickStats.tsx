import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { router } from 'expo-router';

interface HomeQuickStatsProps {
  totalExpensesThisMonth: number;
  totalOwed: number;
  budgetRemaining?: number;
  netPosition?: number;
  lastMonthExpenses?: number;
}

export default function HomeQuickStats({
  totalExpensesThisMonth,
  totalOwed,
  budgetRemaining = 0,
  netPosition = 0,
  lastMonthExpenses = 0
}: HomeQuickStatsProps) {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const safeTotalExpenses = typeof totalExpensesThisMonth === 'number' && !isNaN(totalExpensesThisMonth) ? totalExpensesThisMonth : 0;
  const safeLastMonth = typeof lastMonthExpenses === 'number' && !isNaN(lastMonthExpenses) ? lastMonthExpenses : 0;
  const safeBudgetRemaining = typeof budgetRemaining === 'number' && !isNaN(budgetRemaining) ? budgetRemaining : 0;
  const safeNetPosition = typeof netPosition === 'number' && !isNaN(netPosition) ? netPosition : 0;

  const spendingChange = safeLastMonth > 0 ? ((safeTotalExpenses - safeLastMonth) / safeLastMonth) * 100 : 0;
  const isSpendingUp = spendingChange > 0;

  return (
    <View style={[styles.statsContainer, { backgroundColor: theme.background }]}>
      
      {/* Trend Stat */}
      <TouchableOpacity style={styles.statCard} onPress={() => router.push('/(tabs)/insights')}>
        <View
          style={[
            styles.statGradient,
            { backgroundColor: isSpendingUp ? theme.warning : theme.success }
          ]}
        >
          <Ionicons name={isSpendingUp ? "trending-up" : "trending-down"} size={24} color={theme.surface} />
          <Text style={styles.statAmount}>
            {spendingChange > 0 ? '+' : ''}{spendingChange.toFixed(1)}%
          </Text>
          <Text style={styles.statLabel}>vs Last Month</Text>
        </View>
      </TouchableOpacity>

      {/* Budget Stat */}
      <TouchableOpacity style={styles.statCard} onPress={() => router.push('/(tabs)/budget')}>
        <View
          style={[
            styles.statGradient,
            { backgroundColor: safeBudgetRemaining > 0 ? theme.success : theme.error }
          ]}
        >
          <Ionicons name="wallet" size={24} color={theme.surface} />
          <Text style={styles.statAmount}>
            {theme.currency}{Math.abs(safeBudgetRemaining).toFixed(0)}
          </Text>
          <Text style={styles.statLabel}>
            {safeBudgetRemaining >= 0 ? 'Budget Left' : 'Over Budget'}
          </Text>
        </View>
      </TouchableOpacity>

    </View>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: -12,
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statGradient: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center', // ensures identical UI
  },
  statAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.surface,
    marginVertical: 8,
  },
  statLabel: {
    fontSize: 14,
    color: theme.surfaceSecondary,
  },
});

export { HomeQuickStats };
