import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { router } from 'expo-router';

interface AccountOverviewProps {
  totalExpensesThisMonth: number;
  budgetRemaining: number;
  netPosition: number;
}

export default function AccountOverview({ totalExpensesThisMonth, budgetRemaining, netPosition }: AccountOverviewProps) {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const isOverBudget = budgetRemaining < 0;
  const budgetStatusColor = isOverBudget ? theme.error : theme.success;

  // Fallback for theme.surface if missing
  const surfaceColor = (theme as any).surface ?? theme.background;

  // Calculate financial metrics
  const availableBudget = Math.max(0, budgetRemaining);
  const totalSpent = totalExpensesThisMonth;
  const budgetUtilization = totalExpensesThisMonth > 0 ? (totalExpensesThisMonth / (totalExpensesThisMonth + availableBudget)) * 100 : 0;

  return (
    <View style={styles.container}>
      {/* Budget Overview Card */}
      <View style={[styles.balanceCard, { backgroundColor: surfaceColor }]}>
        <View style={styles.balanceHeader}>
          <View style={styles.balanceIcon}>
            <Ionicons name="wallet" size={24} color={theme.primary} />
          </View>
          <View style={styles.balanceInfo}>
            <Text style={[styles.balanceLabel, { color: theme.textSecondary }]}>Monthly Budget</Text>
            <Text style={[styles.balanceAmount, { color: theme.text }]}>
              {theme.currency}{(totalSpent + availableBudget).toFixed(2)}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.moreButton}
            onPress={() => router.push('/(tabs)/budget')}
          >
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Budget Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(budgetUtilization, 100)}%`,
                  backgroundColor: budgetUtilization > 90 ? theme.error : budgetUtilization > 70 ? theme.warning : theme.success
                }
              ]}
            />
          </View>
          <Text style={[styles.progressText, { color: theme.textSecondary }]}>
            {budgetUtilization.toFixed(1)}% used
          </Text>
        </View>
      </View>

      {/* Spending Summary */}
      <View style={[styles.summaryCard, { backgroundColor: theme.surface }]}>
        <View style={styles.summaryHeader}>
          <Ionicons name="trending-down" size={20} color={theme.primary} />
          <Text style={[styles.summaryTitle, { color: theme.text }]}>This Month</Text>
        </View>

        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Spent</Text>
            <Text style={[styles.summaryValue, { color: theme.text }]}>
              {theme.currency}{totalExpensesThisMonth.toFixed(2)}
            </Text>
          </View>

          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Budget Left</Text>
            <Text style={[styles.summaryValue, { color: budgetStatusColor }]}>
              {theme.currency}{Math.abs(budgetRemaining).toFixed(2)}
            </Text>
          </View>

          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Net Position</Text>
            <Text style={[styles.summaryValue, {
              color: netPosition >= 0 ? theme.success : theme.warning
            }]}>
              {netPosition >= 0 ? '+' : ''}{theme.currency}{netPosition.toFixed(2)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginTop: 20,
    gap: 16,
  },
  balanceCard: {
    borderRadius: 16,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  balanceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  balanceInfo: {
    flex: 1,
    marginLeft: 16,
  },
  balanceLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  moreButton: {
    padding: 8,
  },
  progressContainer: {
    marginTop: 16,
  },
  progressBar: {
    height: 6,
    backgroundColor: theme.surfaceSecondary,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  summaryCard: {
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    marginBottom: 4,
    textAlign: 'center',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export { AccountOverview };