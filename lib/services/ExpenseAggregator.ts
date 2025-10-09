export class ExpenseAggregator {
  static groupExpensesByCategory(expenses: any[]): { [category: string]: any[] } {
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

  static calculateCategoryTotals(expenses: any[]): { [category: string]: { total: number; count: number; average: number } } {
    const grouped = this.groupExpensesByCategory(expenses);

    const totals: { [category: string]: { total: number; count: number; average: number } } = {};

    Object.entries(grouped).forEach(([category, categoryExpenses]) => {
      const total = categoryExpenses.reduce((sum: number, exp: any) => sum + exp.amount, 0);
      const count = categoryExpenses.length;
      const average = count > 0 ? total / count : 0;

      totals[category] = { total, count, average };
    });

    return totals;
  }

  static getTopSpendingCategories(expenses: any[], limit: number = 5): Array<{ category: string; total: number; percentage: number }> {
    const categoryTotals = this.calculateCategoryTotals(expenses);
    const totalSpending = Object.values(categoryTotals).reduce((sum, cat) => sum + cat.total, 0);

    return Object.entries(categoryTotals)
      .map(([category, data]) => ({
        category,
        total: data.total,
        percentage: totalSpending > 0 ? (data.total / totalSpending) * 100 : 0
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, limit);
  }

  static filterExpensesByDateRange(expenses: any[], startDate: Date, endDate: Date): any[] {
    return expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= startDate && expenseDate <= endDate;
    });
  }

  static filterExpensesByAmount(expenses: any[], minAmount?: number, maxAmount?: number): any[] {
    return expenses.filter(expense => {
      if (minAmount !== undefined && expense.amount < minAmount) return false;
      if (maxAmount !== undefined && expense.amount > maxAmount) return false;
      return true;
    });
  }

  static getExpenseSummary(expenses: any[]): {
    totalAmount: number;
    totalCount: number;
    averageAmount: number;
    dateRange: { start: Date | null; end: Date | null };
  } {
    if (expenses.length === 0) {
      return {
        totalAmount: 0,
        totalCount: 0,
        averageAmount: 0,
        dateRange: { start: null, end: null }
      };
    }

    const totalAmount = expenses.reduce((sum: number, exp: any) => sum + exp.amount, 0);
    const totalCount = expenses.length;
    const averageAmount = totalAmount / totalCount;

    const dates = expenses.map(exp => new Date(exp.date)).sort((a, b) => a.getTime() - b.getTime());
    const dateRange = {
      start: dates[0] || null,
      end: dates[dates.length - 1] || null
    };

    return {
      totalAmount,
      totalCount,
      averageAmount,
      dateRange
    };
  }
}