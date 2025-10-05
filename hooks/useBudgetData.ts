import { useMemo, useCallback } from 'react';
import { ColorValue } from 'react-native';
import { useFinanceStore } from '../lib/store/financeStore';

export const useBudgetData = () => {
  const {
    budgets,
    expenses,
    splitBills,
    loadExpenses,
    loadBudgets,
    isLoading,
    error,
    selectedGroup,
    currentUser
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

  const getSpentAmount = (category: string, includeGroupExpenses: boolean = true) => {
    if (!expenses || !Array.isArray(expenses)) {
      return 0;
    }

    // Filter expenses by category and optionally by personal vs group
    const filteredExpenses = expenses.filter(expense =>
      expense && typeof expense === 'object' &&
      expense.category === category &&
      (includeGroupExpenses || !expense.groupId) // Include group expenses if requested
    );

    let totalSpent = filteredExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);

    // Include split bills as expenses for budget tracking
    if (splitBills && Array.isArray(splitBills)) {
      const userSplitBills = splitBills.filter(bill =>
        bill && typeof bill === 'object' &&
        bill.category === category &&
        bill.participants?.some((participant: any) =>
          participant.userId === currentUser?._id && participant.status === 'pending'
        )
      );

      const splitBillAmount = userSplitBills.reduce((sum, bill) => {
        const userParticipant = bill.participants?.find((p: any) => p.userId === currentUser?._id);
        return sum + (userParticipant?.amount || 0);
      }, 0);

      totalSpent += splitBillAmount;
    }

    return totalSpent;
  };

  const getPersonalSpentAmount = (category: string) => {
    return getSpentAmount(category, false); // Only personal expenses
  };

  const getGroupSpentAmount = (category: string) => {
    if (!expenses || !Array.isArray(expenses)) {
      return 0;
    }

    // Only group expenses for this category
    const filteredExpenses = expenses.filter(expense =>
      expense && typeof expense === 'object' &&
      expense.category === category &&
      expense.groupId // Only group expenses
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
    let total = expenses.reduce((sum, expense) => sum + (expense?.amount || 0), 0);

    // Include split bills as expenses for budget tracking
    if (splitBills && Array.isArray(splitBills) && currentUser) {
      const userSplitBills = splitBills.filter(bill =>
        bill.participants?.some((participant: any) =>
          participant.userId === currentUser._id && participant.status === 'pending'
        )
      );

      const splitBillAmount = userSplitBills.reduce((sum, bill) => {
        const userParticipant = bill.participants?.find((p: any) => p.userId === currentUser._id);
        return sum + (userParticipant?.amount || 0);
      }, 0);

      total += splitBillAmount;
    }

    return total;
  }, [expenses, splitBills, currentUser]);

  const loadData = useCallback(async () => {
    try {
      await Promise.all([
        loadExpenses(),
        loadBudgets(), // Load user-level budgets (not group-specific)
        // Load split bills for the selected group if available
        selectedGroup ? useFinanceStore.getState().getGroupSplitBills(selectedGroup._id) : Promise.resolve()
      ]);
    } catch (err) {
      console.error('Error loading budget data:', err);
    }
  }, [loadExpenses, loadBudgets, selectedGroup]);

  const resetMonthlySpending = useCallback(async () => {
    try {
      // This would typically call an API to reset spending data
      // For now, we'll just reload the data
      await loadData();
      console.log('Monthly spending reset completed');
    } catch (error) {
      console.error('Error resetting monthly spending:', error);
    }
  }, [loadData]);

  const getMonthlySpentAmount = (category: string) => {
    if (!expenses || !Array.isArray(expenses)) {
      return 0;
    }

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    // Filter expenses by category and current month
    const filteredExpenses = expenses.filter(expense => {
      if (!expense || typeof expense !== 'object' || expense.category !== category) {
        return false;
      }

      const expenseDate = new Date(expense.createdAt);
      return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
    });

    let totalSpent = filteredExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);

    // Include split bills for current month
    if (splitBills && Array.isArray(splitBills) && currentUser) {
      const currentMonthSplitBills = splitBills.filter(bill => {
        if (!bill || typeof bill !== 'object' || bill.category !== category) {
          return false;
        }

        const billDate = new Date(bill.createdAt);
        return billDate.getMonth() === currentMonth && billDate.getFullYear() === currentYear &&
               bill.participants?.some((participant: any) =>
                 participant.userId === currentUser._id && participant.status === 'pending'
               );
      });

      const splitBillAmount = currentMonthSplitBills.reduce((sum, bill) => {
        const userParticipant = bill.participants?.find((p: any) => p.userId === currentUser._id);
        return sum + (userParticipant?.amount || 0);
      }, 0);

      totalSpent += splitBillAmount;
    }

    return totalSpent;
  };

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
    getPersonalSpentAmount,
    getGroupSpentAmount,
    getMonthlySpentAmount,
    getProgressPercentage,
    getProgressColor,
    loadData,
    resetMonthlySpending,
  };
};