class ExpenseFilter {
  static filterByPeriod(expenses: any[], period: string): any[] {
    const now = new Date();
    const periodStart = new Date();

    switch (period) {
      case 'week':
        periodStart.setDate(now.getDate() - 7);
        break;
      case 'month':
        periodStart.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        periodStart.setFullYear(now.getFullYear() - 1);
        break;
      default:
        periodStart.setMonth(now.getMonth() - 1);
    }

    return expenses.filter((expense: any) =>
      new Date(expense.createdAt) >= periodStart
    );
  }
}

export default ExpenseFilter;