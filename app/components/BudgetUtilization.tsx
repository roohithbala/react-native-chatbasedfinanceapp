import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface BudgetUtilizationProps {
  budgets: Record<string, number>;
  categoryTotals: Record<string, number>;
}

export const BudgetUtilization: React.FC<BudgetUtilizationProps> = ({
  budgets,
  categoryTotals,
}) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Budget Utilization</Text>
      <View style={styles.budgetContainer}>
        {Object.entries(budgets).map(([category, budgetAmount]) => {
          const spent = categoryTotals[category] || 0;
          const utilization = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0;
          const remaining = Math.max(0, budgetAmount - spent);

          return (
            <View key={category} style={styles.budgetItem}>
              <View style={styles.budgetHeader}>
                <Text style={styles.budgetCategory}>{category}</Text>
                <Text style={styles.budgetAmount}>
                  ₹{spent.toFixed(2)} / ₹{budgetAmount.toFixed(2)}
                </Text>
              </View>
              <View style={styles.budgetProgressContainer}>
                <View style={styles.budgetProgressTrack}>
                  <View
                    style={[
                      styles.budgetProgressFill,
                      {
                        width: `${Math.min(utilization, 100)}%`,
                        backgroundColor: utilization > 90 ? '#EF4444' :
                                       utilization > 75 ? '#F59E0B' : '#10B981'
                      },
                    ]}
                  />
                </View>
                <Text style={styles.budgetPercentage}>
                  {utilization.toFixed(1)}%
                </Text>
              </View>
              {remaining > 0 && (
                <Text style={styles.budgetRemaining}>
                  ₹{remaining.toFixed(2)} remaining
                </Text>
              )}
              {remaining <= 0 && (
                <Text style={styles.budgetOver}>
                  Over budget by ₹{Math.abs(remaining).toFixed(2)}
                </Text>
              )}
            </View>
          );
        })}
        {Object.keys(budgets).length === 0 && (
          <View style={styles.emptyBudget}>
            <Ionicons name="wallet-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyBudgetText}>No budgets set yet</Text>
            <Text style={styles.emptyBudgetSubtext}>
              Set budgets to track your spending limits
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 16,
  },
  budgetContainer: {
    gap: 16,
  },
  budgetItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
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
    color: '#1E293B',
  },
  budgetAmount: {
    fontSize: 14,
    color: '#64748B',
  },
  budgetProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  budgetProgressTrack: {
    flex: 1,
    height: 8,
    backgroundColor: '#F1F5F9',
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
    color: '#64748B',
    minWidth: 35,
    textAlign: 'right',
  },
  budgetRemaining: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
  },
  budgetOver: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '500',
  },
  emptyBudget: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  emptyBudgetText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 16,
  },
  emptyBudgetSubtext: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
  },
});

export default BudgetUtilization;