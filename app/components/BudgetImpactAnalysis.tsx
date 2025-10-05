import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBudgetsStore } from '@/lib/store/budgetsStore';
import { useTheme } from '@/app/context/ThemeContext';

interface BudgetImpactAnalysisProps {
  category: string;
  totalAmount: number;
  participantsCount: number;
}

interface BudgetImpact {
  currentBudget: number;
  currentSpent: number;
  projectedSpent: number;
  remainingBudget: number;
  utilizationPercentage: number;
  projectedUtilization: number;
  willExceedBudget: boolean;
  excessAmount: number;
}

export default function BudgetImpactAnalysis({
  category,
  totalAmount,
  participantsCount
}: BudgetImpactAnalysisProps) {
  const { theme } = useTheme();
  const { detailedBudgets } = useBudgetsStore();
  const styles = getStyles(theme);

  const budgetImpact: BudgetImpact | null = useMemo(() => {
    if (!detailedBudgets || !category || !totalAmount) return null;

    const categoryBudget = detailedBudgets[category];
    if (!categoryBudget || !categoryBudget.amount) return null;

    const currentSpent = categoryBudget.spent || 0;
    const currentBudget = categoryBudget.amount;
    const projectedSpent = currentSpent + totalAmount;
    const remainingBudget = currentBudget - projectedSpent;
    const utilizationPercentage = (currentSpent / currentBudget) * 100;
    const projectedUtilization = (projectedSpent / currentBudget) * 100;
    const willExceedBudget = projectedSpent > currentBudget;
    const excessAmount = willExceedBudget ? projectedSpent - currentBudget : 0;

    return {
      currentBudget,
      currentSpent,
      projectedSpent,
      remainingBudget,
      utilizationPercentage,
      projectedUtilization,
      willExceedBudget,
      excessAmount
    };
  }, [detailedBudgets, category, totalAmount]);

  if (!budgetImpact) {
    return (
      <View style={[styles.container, { backgroundColor: theme.surfaceSecondary }]}>
        <Text style={[styles.noBudgetText, { color: theme.textSecondary }]}>
          No budget set for {category} category
        </Text>
      </View>
    );
  }

  const getUtilizationColor = (percentage: number) => {
    if (percentage >= 100) return theme.error;
    if (percentage >= 80) return theme.warning || '#F59E0B';
    return theme.success;
  };

  const getStatusIcon = () => {
    if (budgetImpact.willExceedBudget) {
      return <Ionicons name="warning" size={20} color={theme.error} />;
    }
    if (budgetImpact.projectedUtilization >= 80) {
      return <Ionicons name="alert-circle" size={20} color={theme.warning || '#F59E0B'} />;
    }
    return <Ionicons name="checkmark-circle" size={20} color={theme.success} />;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.surfaceSecondary }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Budget Impact</Text>
        {getStatusIcon()}
      </View>

      <View style={styles.budgetOverview}>
        <View style={styles.budgetRow}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Current Budget:</Text>
          <Text style={[styles.value, { color: theme.text }]}>
            {theme.currency}{budgetImpact.currentBudget.toFixed(2)}
          </Text>
        </View>

        <View style={styles.budgetRow}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Already Spent:</Text>
          <Text style={[styles.value, { color: theme.text }]}>
            {theme.currency}{budgetImpact.currentSpent.toFixed(2)}
            <Text style={[styles.percentage, { color: getUtilizationColor(budgetImpact.utilizationPercentage) }]}>
              {' '}({budgetImpact.utilizationPercentage.toFixed(1)}%)
            </Text>
          </Text>
        </View>

        <View style={styles.budgetRow}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>After This Bill:</Text>
          <Text style={[styles.value, {
            color: budgetImpact.willExceedBudget ? theme.error : theme.text,
            fontWeight: '600'
          }]}>
            {theme.currency}{budgetImpact.projectedSpent.toFixed(2)}
            <Text style={[styles.percentage, { color: getUtilizationColor(budgetImpact.projectedUtilization) }]}>
              {' '}({budgetImpact.projectedUtilization.toFixed(1)}%)
            </Text>
          </Text>
        </View>

        <View style={styles.budgetRow}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Remaining Budget:</Text>
          <Text style={[styles.value, {
            color: budgetImpact.remainingBudget < 0 ? theme.error : theme.success
          }]}>
            {theme.currency}{Math.abs(budgetImpact.remainingBudget).toFixed(2)}
            {budgetImpact.remainingBudget < 0 && ' (Over Budget)'}
          </Text>
        </View>
      </View>

      {budgetImpact.willExceedBudget && (
        <View style={[styles.warningContainer, { backgroundColor: theme.error + '20' }]}>
          <Ionicons name="warning" size={16} color={theme.error} />
          <Text style={[styles.warningText, { color: theme.error }]}>
            This bill will exceed your {category} budget by {theme.currency}{budgetImpact.excessAmount.toFixed(2)}
          </Text>
        </View>
      )}

      {budgetImpact.projectedUtilization >= 80 && !budgetImpact.willExceedBudget && (
        <View style={[styles.warningContainer, { backgroundColor: (theme.warning || '#F59E0B') + '20' }]}>
          <Ionicons name="alert-circle" size={16} color={theme.warning || '#F59E0B'} />
          <Text style={[styles.warningText, { color: theme.warning || '#F59E0B' }]}>
            This bill will use {budgetImpact.projectedUtilization.toFixed(1)}% of your {category} budget
          </Text>
        </View>
      )}

      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { backgroundColor: theme.surface }]}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.min(budgetImpact.projectedUtilization, 100)}%`,
                backgroundColor: getUtilizationColor(budgetImpact.projectedUtilization)
              }
            ]}
          />
          {budgetImpact.projectedUtilization > 100 && (
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(budgetImpact.projectedUtilization - 100, 20)}%`,
                  backgroundColor: theme.error,
                  position: 'absolute',
                  right: 0
                }
              ]}
            />
          )}
        </View>
        <View style={styles.progressLabels}>
          <Text style={[styles.progressLabel, { color: theme.textSecondary }]}>0%</Text>
          <Text style={[styles.progressLabel, { color: theme.textSecondary }]}>50%</Text>
          <Text style={[styles.progressLabel, { color: theme.textSecondary }]}>100%</Text>
        </View>
      </View>

      <Text style={[styles.note, { color: theme.textSecondary }]}>
        * Budget impact is calculated for the current {category} budget period
      </Text>
    </View>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  noBudgetText: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  budgetOverview: {
    marginBottom: 12,
  },
  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    flex: 1,
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
  },
  percentage: {
    fontSize: 12,
    fontWeight: '600',
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  warningText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontSize: 10,
  },
  note: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 8,
  },
});