import { useMemo } from 'react';

export const useInsightsCalculations = (expenses: any[], budgets: any, groups: any[]) => {
  // Calculate spending trend from actual expenses
  const spendingTrend = useMemo(() => {
    const defaultData = {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [{ data: [0, 0, 0, 0, 0, 0, 0], strokeWidth: 3 }],
    };

    if (!expenses?.length) return defaultData;

    // Group expenses by day and calculate totals
    const dailyTotals = expenses.reduce((acc, expense) => {
      if (!expense?.amount || !expense?.createdAt) return acc;
      const day = new Date(expense.createdAt).getDay();
      acc[day] = (acc[day] || 0) + expense.amount;
      return acc;
    }, Array(7).fill(0));

    return {
      labels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      datasets: [{ data: dailyTotals, strokeWidth: 3 }],
    };
  }, [expenses]);

  const categorySpending = useMemo(() => {
    const categories = {
      Food: { color: '#EF4444' },
      Transport: { color: '#3B82F6' },
      Entertainment: { color: '#8B5CF6' },
      Shopping: { color: '#F59E0B' },
      Bills: { color: '#10B981' },
      Health: { color: '#EC4899' },
    };

    if (!expenses?.length) {
      // Return default data if no expenses
      return Object.entries(categories).map(([name, { color }]) => ({
        name,
        population: 0,
        color,
        legendFontColor: '#64748B',
        legendFontSize: 12,
      }));
    }

    // Calculate totals by category
    const totals = expenses.reduce((acc, expense) => {
      if (!expense?.amount || !expense?.category) return acc;
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categories)
      .map(([name, { color }]) => ({
        name,
        population: totals[name] || 0,
        color,
        legendFontColor: '#64748B',
        legendFontSize: 12,
      }))
      .filter(cat => cat.population > 0); // Only show categories with spending
  }, [expenses]);

  // Calculate category totals for budget utilization
  const categoryTotals = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const thisMonthExpenses = expenses.filter((expense: any) => {
      const expenseDate = new Date(expense.createdAt);
      return expenseDate.getMonth() === currentMonth &&
             expenseDate.getFullYear() === currentYear;
    });

    return thisMonthExpenses.reduce((acc, expense: any) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);
  }, [expenses]);

  // Calculate real stats for quick overview
  const realStats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Calculate this month's spending
    const thisMonthExpenses = expenses.filter((expense: any) => {
      const expenseDate = new Date(expense.createdAt);
      return expenseDate.getMonth() === currentMonth &&
             expenseDate.getFullYear() === currentYear;
    });

    const thisMonthTotal = thisMonthExpenses.reduce((sum, expense: any) => sum + expense.amount, 0);

    // Calculate last month's spending
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const lastMonthExpenses = expenses.filter((expense: any) => {
      const expenseDate = new Date(expense.createdAt);
      return expenseDate.getMonth() === lastMonth &&
             expenseDate.getFullYear() === lastMonthYear;
    });

    const lastMonthTotal = lastMonthExpenses.reduce((sum, expense: any) => sum + expense.amount, 0);

    // Calculate percentage change
    const percentageChange = lastMonthTotal > 0
      ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100
      : 0;

    // Calculate total budget and remaining
    const totalBudget = Object.values(budgets as Record<string, number>).reduce((sum: number, amount: number) => sum + amount, 0);
    const remainingBudget = Math.max(0, totalBudget - thisMonthTotal);

    // Count active groups (groups with recent activity)
    const activeGroups = groups.filter((group: any) => {
      // Consider a group active if it has expenses in the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      return expenses.some((expense: any) =>
        expense.groupId === group._id &&
        new Date(expense.createdAt) > thirtyDaysAgo
      );
    }).length;

    return {
      thisMonthTotal,
      percentageChange,
      activeGroups,
      remainingBudget,
      totalBudget
    };
  }, [expenses, budgets, groups]);

  // Generate real insights based on actual data
  const realInsights = useMemo(() => {
    const insights = [];
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Check budget utilization
    Object.entries(budgets as Record<string, number>).forEach(([category, budgetAmount]: [string, number]) => {
      const spent = categoryTotals[category] || 0;
      const utilization = (spent / budgetAmount) * 100;

      if (utilization > 90) {
        insights.push({
          id: `budget-${category}`,
          title: 'Budget Alert',
          description: `You've used ${utilization.toFixed(1)}% of your ${category} budget`,
          type: 'warning',
          icon: '⚠️',
        });
      } else if (utilization < 50 && spent > 0) {
        insights.push({
          id: `budget-${category}`,
          title: 'Budget Achievement',
          description: `Great job staying under budget for ${category}!`,
          type: 'success',
          icon: '🎉',
        });
      }
    });

    // Add some general tips if no specific insights
    if (insights.length === 0) {
      insights.push({
        id: 'general-tip',
        title: 'Financial Tip',
        description: 'Track your expenses regularly to maintain better financial control',
        type: 'tip',
        icon: '💡',
      });
    }

    return insights;
  }, [expenses, budgets, groups, categoryTotals]);

  return {
    spendingTrend,
    categorySpending,
    categoryTotals,
    realStats,
    realInsights,
  };
};