import { useMemo, useCallback } from 'react';
import { ColorValue } from 'react-native';
import { useFinanceStore } from '../lib/store/financeStore';

export const useBudgetData = () => {
  const {
    budgets,
    expenses,
    loadExpenses,
    loadBudgets,
    isLoading,
    error,
    selectedGroup
  } = useFinanceStore();

  const categories = ['Food', 'Transport', 'Entertainment', 'Shopping', 'Bills', 'Health', 'Other'];

  const categoryIcons = {
    Food: '🍽️',
    Transport: '🚗',
    Entertainment: '🎬',
    Shopping: '🛍️',
    Bills: '📄',
    Health: '🏥',
    Other: '📋',
  };

  const categoryColors: Record<string, [ColorValue, ColorValue]> = {
    Food: ['#EF4444', '#F87171'],
    Transport: ['#3B82F6', '#60A5FA'],
    Entertainment: ['#8B5CF6', '#A78BFA'],
    Shopping: ['#F59E0B', '#FBBF24'],
    Bills: ['#10B981', '#34D399'],
    Health: ['#EC4899', '#F472B6'],
    Other: ['#6B7280', '#9CA3AF'],
  };

  const getSpentAmount = (category: string) => {
    if (!expenses || !Array.isArray(expenses)) {
      return 0;
    }

    // Track expenses across all groups for the user (not just selected group)
    const filteredExpenses = expenses.filter(expense =>
      expense && typeof expense === 'object' &&
      expense.category === category
    );

    return filteredExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
  };

  const getProgressPercentage = (spent: number, limit: number) => {
    if (limit === 0) return 0;
    return Math.min((spent / limit) * 100, 100);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return '#EF4444';
    if (percentage >= 70) return '#F59E0B';
    return '#10B981';
  };

  const totalBudget = useMemo(() =>
    Object.values(budgets || {}).reduce((sum, budget) => sum + (typeof budget === 'number' ? budget : 0), 0),
    [budgets]
  );

  const totalSpent = useMemo(() => {
    if (!expenses || !Array.isArray(expenses)) {
      return 0;
    }

    // Track all user expenses across all groups
    return expenses.reduce((sum, expense) => sum + (expense?.amount || 0), 0);
  }, [expenses]);

  const loadData = useCallback(async () => {
    try {
      await Promise.all([
        loadExpenses(),
        loadBudgets() // Load user-level budgets (not group-specific)
      ]);
    } catch (err) {
      console.error('Error loading budget data:', err);
    }
  }, [loadExpenses, loadBudgets]);

  return {
    budgets,
    expenses,
    categories,
    categoryIcons,
    categoryColors,
    isLoading,
    error,
    selectedGroup,
    totalBudget,
    totalSpent,
    getSpentAmount,
    getProgressPercentage,
    getProgressColor,
    loadData,
  };
};