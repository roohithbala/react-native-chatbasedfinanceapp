import { OpenAIClient } from './OpenAIClient';
import { FinancialInsight, SpendingAnalysis } from './types';

export class SpendingDataProcessor {
  static processExpenses(expenses: any[]): Record<string, { total: number; count: number; items: any[] }> {
    return expenses.reduce((acc, expense) => {
      const category = expense.category || 'Other';
      if (!acc[category]) {
        acc[category] = { total: 0, count: 0, items: [] };
      }
      acc[category].total += expense.amount;
      acc[category].count += 1;
      acc[category].items.push({
        description: expense.description,
        amount: expense.amount,
        date: expense.createdAt,
      });
      return acc;
    }, {} as Record<string, { total: number; count: number; items: any[] }>);
  }

  static calculateTotalSpending(expenseSummary: Record<string, { total: number; count: number; items: any[] }>): number {
    return Object.values(expenseSummary).reduce((sum: number, cat) => sum + cat.total, 0);
  }

  static getCategories(expenseSummary: Record<string, { total: number; count: number; items: any[] }>): string[] {
    return Object.keys(expenseSummary);
  }
}