import { useState, useMemo } from 'react';

interface Expense {
  _id: string;
  amount: number;
  category: string;
  description: string;
  createdAt: string | Date;
  groupId?: string;
}

export const usePreviousMonthSpendings = (expenses: Expense[]) => {
  const [currentMonthOffset, setCurrentMonthOffset] = useState(1); // 1 = previous month, 2 = 2 months ago, etc.

  const monthData = useMemo(() => {
    if (!expenses || expenses.length === 0) {
      const now = new Date();
      const targetMonth = new Date(now.getFullYear(), now.getMonth() - currentMonthOffset, 1);
      const monthName = targetMonth.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long'
      });

      return {
        monthName,
        totalSpent: 0,
        categoryBreakdown: [],
        dailySpending: [],
        monthOverMonthChange: 0,
        transactionCount: 0,
        averageDaily: 0,
        topCategory: null,
        spendingDays: 0,
      };
    }

    const now = new Date();
    const targetMonth = now.getMonth() - currentMonthOffset;
    const targetYear = now.getFullYear() + Math.floor(targetMonth / 12);
    const actualTargetMonth = ((targetMonth % 12) + 12) % 12;

    // Filter expenses for target month
    const targetMonthExpenses = expenses.filter((expense) => {
      const expenseDate = new Date(expense.createdAt);
      return expenseDate.getMonth() === actualTargetMonth &&
             expenseDate.getFullYear() === targetYear;
    });

    // Calculate totals by category
    const categoryTotals = targetMonthExpenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    // Sort categories by spending amount
    const sortedCategories = Object.entries(categoryTotals)
      .sort(([, a], [, b]) => b - a)
      .map(([category, amount]) => ({ category, amount }));

    // Calculate daily spending
    const dailySpending = targetMonthExpenses.reduce((acc, expense) => {
      const date = new Date(expense.createdAt).toDateString();
      acc[date] = (acc[date] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    const sortedDays = Object.entries(dailySpending)
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .map(([date, amount]) => ({
        date: new Date(date),
        amount,
        dayName: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: new Date(date).getDate(),
      }));

    // Calculate month-over-month comparison
    const comparisonMonth = actualTargetMonth === 0 ? 11 : actualTargetMonth - 1;
    const comparisonYear = actualTargetMonth === 0 ? targetYear - 1 : targetYear;

    const comparisonMonthExpenses = expenses.filter((expense) => {
      const expenseDate = new Date(expense.createdAt);
      return expenseDate.getMonth() === comparisonMonth &&
             expenseDate.getFullYear() === comparisonYear;
    });

    const comparisonMonthTotal = comparisonMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const targetMonthTotal = targetMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0);

    const monthOverMonthChange = comparisonMonthTotal > 0
      ? ((targetMonthTotal - comparisonMonthTotal) / comparisonMonthTotal) * 100
      : 0;

    // Get month name
    const monthName = new Date(targetYear, actualTargetMonth, 1).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    });

    // Calculate additional metrics
    const daysInMonth = new Date(targetYear, actualTargetMonth + 1, 0).getDate();
    const spendingDays = Object.keys(dailySpending).length;
    const topCategory = sortedCategories.length > 0 ? sortedCategories[0] : null;

    return {
      monthName,
      totalSpent: targetMonthTotal,
      categoryBreakdown: sortedCategories,
      dailySpending: sortedDays,
      monthOverMonthChange,
      transactionCount: targetMonthExpenses.length,
      averageDaily: targetMonthTotal / daysInMonth,
      topCategory,
      spendingDays,
    };
  }, [expenses, currentMonthOffset]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setCurrentMonthOffset(prev => prev + 1);
    } else {
      setCurrentMonthOffset(prev => Math.max(1, prev - 1));
    }
  };

  const resetToPreviousMonth = () => {
    setCurrentMonthOffset(1);
  };

  return {
    monthData,
    currentMonthOffset,
    navigateMonth,
    resetToPreviousMonth,
  };
};