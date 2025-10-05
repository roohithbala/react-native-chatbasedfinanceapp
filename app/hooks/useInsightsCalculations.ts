import { useMemo } from 'react';

interface Expense {
  _id: string;
  amount: number;
  category: string;
  createdAt: string | Date;
  description: string;
}

interface Budget {
  _id: string;
  category: string;
  amount: number;
  spent?: number;
}

interface Group {
  _id: string;
  name: string;
  members: any[];
}

export const useInsightsCalculations = (
  expenses: Expense[],
  budgets: Budget[],
  groups: Group[]
) => {
  const spendingTrend = useMemo(() => {
    if (!expenses || expenses.length === 0) {
      return [];
    }

    // Group expenses by month
    const monthlyData = expenses.reduce((acc, expense) => {
      const date = new Date(expense.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!acc[monthKey]) {
        acc[monthKey] = {
          month: monthKey,
          amount: 0,
          count: 0
        };
      }

      acc[monthKey].amount += expense.amount;
      acc[monthKey].count += 1;

      return acc;
    }, {} as Record<string, { month: string; amount: number; count: number }>);

    // Convert to array and sort by date
    return Object.values(monthlyData)
      .sort((a, b) => a.month.localeCompare(b.month))
      .map(item => ({
        month: item.month,
        amount: item.amount,
        count: item.count
      }));
  }, [expenses]);

  const categorySpending = useMemo(() => {
    if (!expenses || expenses.length === 0) {
      return [];
    }

    const categoryData = expenses.reduce((acc, expense) => {
      const category = expense.category || 'Other';
      if (!acc[category]) {
        acc[category] = {
          category,
          amount: 0,
          count: 0
        };
      }
      acc[category].amount += expense.amount;
      acc[category].count += 1;
      return acc;
    }, {} as Record<string, { category: string; amount: number; count: number }>);

    return Object.values(categoryData)
      .sort((a, b) => b.amount - a.amount)
      .map(item => ({
        category: item.category,
        amount: item.amount,
        count: item.count,
        percentage: expenses.length > 0 ? (item.amount / expenses.reduce((sum, exp) => sum + exp.amount, 0)) * 100 : 0
      }));
  }, [expenses]);

  const categoryTotals = useMemo(() => {
    return categorySpending.reduce((acc, item) => {
      acc[item.category] = item.amount;
      return acc;
    }, {} as Record<string, number>);
  }, [categorySpending]);

  const realStats = useMemo(() => {
    if (!expenses || expenses.length === 0) {
      return {
        totalSpent: 0,
        totalTransactions: 0,
        averageTransaction: 0,
        topCategory: 'None',
        monthlyChange: 0,
        budgetUtilization: 0
      };
    }

    const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const totalTransactions = expenses.length;
    const averageTransaction = totalSpent / totalTransactions;

    const topCategory = categorySpending[0]?.category || 'None';

    // Calculate monthly change (compare current month with previous month)
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const currentMonthExpenses = expenses.filter(expense => {
      const date = new Date(expense.createdAt);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });

    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const previousMonthExpenses = expenses.filter(expense => {
      const date = new Date(expense.createdAt);
      return date.getMonth() === previousMonth && date.getFullYear() === previousYear;
    });

    const currentMonthTotal = currentMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const previousMonthTotal = previousMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0);

    const monthlyChange = previousMonthTotal > 0
      ? ((currentMonthTotal - previousMonthTotal) / previousMonthTotal) * 100
      : 0;

    // Calculate budget utilization
    const totalBudget = budgets.reduce((sum, budget) => sum + budget.amount, 0);
    const budgetUtilization = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

    return {
      totalSpent,
      totalTransactions,
      averageTransaction,
      topCategory,
      monthlyChange,
      budgetUtilization
    };
  }, [expenses, budgets, categorySpending]);

  const realInsights = useMemo(() => {
    const insights = [];

    // Spending insights
    if (realStats.monthlyChange > 20) {
      insights.push({
        type: 'warning',
        title: 'Spending Increase',
        description: `Your spending increased by ${realStats.monthlyChange.toFixed(1)}% compared to last month`,
        priority: 'high'
      });
    } else if (realStats.monthlyChange < -20) {
      insights.push({
        type: 'success',
        title: 'Spending Decrease',
        description: `Great job! Your spending decreased by ${Math.abs(realStats.monthlyChange).toFixed(1)}% compared to last month`,
        priority: 'medium'
      });
    }

    // Budget insights
    if (realStats.budgetUtilization > 90) {
      insights.push({
        type: 'danger',
        title: 'Budget Alert',
        description: `You've used ${realStats.budgetUtilization.toFixed(1)}% of your total budget`,
        priority: 'high'
      });
    }

    // Category insights
    const topCategoryData = categorySpending[0];
    if (topCategoryData && topCategoryData.percentage > 50) {
      insights.push({
        type: 'info',
        title: 'Category Focus',
        description: `${topCategoryData.category} accounts for ${topCategoryData.percentage.toFixed(1)}% of your spending`,
        priority: 'low'
      });
    }

    // Transaction frequency insights
    if (realStats.totalTransactions > 50) {
      insights.push({
        type: 'info',
        title: 'High Activity',
        description: `You've made ${realStats.totalTransactions} transactions this period`,
        priority: 'low'
      });
    }

    return insights;
  }, [realStats, categorySpending]);

  return {
    spendingTrend,
    categorySpending,
    categoryTotals,
    realStats,
    realInsights,
  };
};