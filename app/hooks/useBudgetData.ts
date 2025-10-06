import { useState, useEffect, useMemo } from 'react';
import { useFinanceStore } from '@/lib/store/financeStore';
import { Alert } from 'react-native';

export const useBudgetData = () => {
  const {
    currentUser,
    budgets,
    expenses,
    isLoading: storeLoading,
    error: storeError,
    loadBudgets,
    loadExpenses,
  } = useFinanceStore();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load data on mount
  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser]);

  const loadData = async () => {
    if (!currentUser) return;

    try {
      setIsLoading(true);
      setError(null);
      await Promise.all([loadBudgets(), loadExpenses()]);
    } catch (err: any) {
      setError(err.message || 'Failed to load budget data');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate derived data
  const categories = useMemo(() => {
    const allCategories = new Set<string>();

    // Add categories from budgets
    Object.keys(budgets).forEach(category => allCategories.add(category));

    // Add categories from expenses
    expenses.forEach(expense => {
      if (expense.category) allCategories.add(expense.category);
    });

    return Array.from(allCategories).sort();
  }, [budgets, expenses]);

  const categoryIcons = useMemo(() => ({
    Food: '🍽️',
    Transport: '🚗',
    Entertainment: '🎬',
    Shopping: '🛍️',
    Bills: '💡',
    Health: '🏥',
    Other: '📦',
  }), []);

  const categoryColors = useMemo(() => ({
    Food: ['#FF6B6B', '#FF8E8E'] as [string, string],
    Transport: ['#4ECDC4', '#6FDCE1'] as [string, string],
    Entertainment: ['#45B7D1', '#5FC9E0'] as [string, string],
    Shopping: ['#96CEB4', '#A8DADC'] as [string, string],
    Bills: ['#FFEAA7', '#FFF3C4'] as [string, string],
    Health: ['#DDA0DD', '#E6B3E6'] as [string, string],
    Other: ['#A8A8A8', '#C0C0C0'] as [string, string],
  }), []);

  const totalBudget = useMemo(() => {
    return Object.values(budgets).reduce((sum: number, budget: any) =>
      sum + (typeof budget === 'number' ? budget : budget?.amount || 0), 0
    );
  }, [budgets]);

  const totalSpent = useMemo(() => {
    return expenses.reduce((sum, expense) => sum + expense.amount, 0);
  }, [expenses]);

  const getSpentAmount = (category: string) => {
    return expenses
      .filter(expense => expense.category === category)
      .reduce((sum, expense) => sum + expense.amount, 0);
  };

  const getPersonalSpentAmount = (category: string) => {
    // For now, return same as getSpentAmount (personal expenses)
    // TODO: Implement group vs personal expense filtering
    return getSpentAmount(category);
  };

  const getGroupSpentAmount = (category: string) => {
    // For now, return 0 (no group expenses)
    // TODO: Implement group expense filtering
    return 0;
  };

  const getProgressPercentage = (spent: number, limit: number) => {
    if (limit === 0) return 0;
    return Math.min((spent / limit) * 100, 100);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return '#EF4444'; // Red
    if (percentage >= 75) return '#F59E0B'; // Orange
    if (percentage >= 50) return '#FCD34D'; // Yellow
    return '#10B981'; // Green
  };

  return {
    budgets,
    expenses,
    categories,
    categoryIcons,
    categoryColors,
    isLoading: isLoading || storeLoading,
    error: error || storeError,
    totalBudget,
    totalSpent,
    getSpentAmount,
    getPersonalSpentAmount,
    getGroupSpentAmount,
    getProgressPercentage,
    getProgressColor,
    loadData,
  };
};

export default useBudgetData;