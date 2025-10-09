class TrendAnalysisService {
  calculateMonthlySpending(expenses: any[]): any[] {
    const monthlyData: { [key: string]: { amount: number; count: number } } = {};

    expenses.forEach(expense => {
      const date = new Date(expense.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { amount: 0, count: 0 };
      }

      monthlyData[monthKey].amount += expense.amount;
      monthlyData[monthKey].count += 1;
    });

    return Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, data]) => ({
        month: new Date(key + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        amount: data.amount,
        count: data.count
      }));
  }

  calculateSpendingTrend(monthlySpending: any[]): string {
    if (monthlySpending.length < 2) {
      return 'insufficient_data';
    }

    const recent = monthlySpending.slice(-3); // Last 3 months
    const earlier = monthlySpending.slice(-6, -3); // Previous 3 months

    if (earlier.length === 0) {
      return 'insufficient_data';
    }

    const recentAvg = recent.reduce((sum: number, month: any) => sum + month.amount, 0) / recent.length;
    const earlierAvg = earlier.reduce((sum: number, month: any) => sum + month.amount, 0) / earlier.length;

    const changePercent = ((recentAvg - earlierAvg) / earlierAvg) * 100;

    if (changePercent > 10) return 'increasing';
    if (changePercent < -10) return 'decreasing';
    return 'stable';
  }

  groupExpensesByCategory(expenses: any[]): { [category: string]: any[] } {
    const grouped: { [category: string]: any[] } = {};

    expenses.forEach(expense => {
      const category = expense.category || 'Uncategorized';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(expense);
    });

    return grouped;
  }
}

export default TrendAnalysisService;