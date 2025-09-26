import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

interface BudgetUtilizationProps {
  budgets: Record<string, number>;
  categoryTotals: Record<string, number>;
}

export const BudgetUtilization: React.FC<BudgetUtilizationProps> = ({
  budgets,
  categoryTotals,
}) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Budget Utilization</Text>
      <View style={styles.budgetContainer}>
        {Object.entries(budgets).map(([category, budgetAmount]) => {
          const spent = categoryTotals[category] || 0;
          const utilization = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0;
          const remaining = Math.max(0, budgetAmount - spent);

          return (
            <View key={category} style={[styles.budgetItem, { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1 }]}>
              <View style={styles.budgetHeader}>
                <Text style={[styles.budgetCategory, { color: theme.text }]}>{category}</Text>
                <Text style={[styles.budgetAmount, { color: theme.textSecondary }]}>
                  {theme.currency}{spent.toFixed(2)} / {theme.currency}{budgetAmount.toFixed(2)}
                </Text>
              </View>
              <View style={styles.budgetProgressContainer}>
                <View style={[styles.budgetProgressTrack, { backgroundColor: theme.surfaceSecondary }]}>
                  <View
                    style={[
                      styles.budgetProgressFill,
                      {
                        width: `${Math.min(utilization, 100)}%`,
                        backgroundColor: utilization > 90 ? theme.error :
                                       utilization > 75 ? theme.warning : theme.success
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.budgetPercentage, { color: theme.textSecondary }]}>
                  {utilization.toFixed(1)}%
                </Text>
              </View>
              {remaining > 0 && (
                <Text style={[styles.budgetRemaining, { color: theme.success }]}>
                  {theme.currency}{remaining.toFixed(2)} remaining
                </Text>
              )}
              {remaining <= 0 && (
                <Text style={[styles.budgetOver, { color: theme.error }]}>
                  Over budget by {theme.currency}{Math.abs(remaining).toFixed(2)}
                </Text>
              )}
            </View>
          );
        })}
        {Object.keys(budgets).length === 0 && (
          <View style={[styles.emptyBudget, { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1 }]}>
            <Ionicons name="wallet-outline" size={48} color={theme.textSecondary} />
            <Text style={[styles.emptyBudgetText, { color: theme.text }]}>No budgets set yet</Text>
            <Text style={[styles.emptyBudgetSubtext, { color: theme.textSecondary }]}>
              Set budgets to track your spending limits
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 16,
  },
  budgetContainer: {
    gap: 16,
  },
  budgetItem: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 16,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  budgetCategory: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
  },
  budgetAmount: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  budgetProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  budgetProgressTrack: {
    flex: 1,
    height: 8,
    backgroundColor: theme.surfaceSecondary,
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 12,
  },
  budgetProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  budgetPercentage: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.textSecondary,
    minWidth: 35,
    textAlign: 'right',
  },
  budgetRemaining: {
    fontSize: 12,
    color: theme.success,
    fontWeight: '500',
  },
  budgetOver: {
    fontSize: 12,
    color: theme.error,
    fontWeight: '500',
  },
  emptyBudget: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: theme.surface,
    borderRadius: 12,
  },
  emptyBudgetText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginTop: 16,
  },
  emptyBudgetSubtext: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
});

export default BudgetUtilization;