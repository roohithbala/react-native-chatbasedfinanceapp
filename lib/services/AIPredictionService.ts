import { OpenAIClient } from './OpenAIClient';
import { SpendingPredictionService } from './SpendingPredictionService';
import { SavingsAnalysisService } from './SavingsAnalysisService';
import { ExpenseAggregator } from './ExpenseAggregator';

export class AIPredictionService {
  private openAIClient: OpenAIClient;
  private spendingPredictionService: SpendingPredictionService;
  private savingsAnalysisService: SavingsAnalysisService;

  constructor() {
    this.openAIClient = OpenAIClient.getInstance();
    this.spendingPredictionService = new SpendingPredictionService();
    this.savingsAnalysisService = new SavingsAnalysisService();
  }

  async predictFutureSpending(expenses: any[], months: number = 3): Promise<any> {
    return this.spendingPredictionService.predictFutureSpending(expenses, months);
  }

  async analyzeSavingsPotential(expenses: any[]): Promise<any> {
    return this.savingsAnalysisService.analyzeSavingsPotential(expenses);
  }

  // Utility methods for backward compatibility
  groupExpensesByCategory(expenses: any[]): Record<string, { total: number; count: number; percentage: number }> {
    const categoryTotals = ExpenseAggregator.calculateCategoryTotals(expenses);
    const totalSpending = Object.values(categoryTotals).reduce((sum, cat) => sum + cat.total, 0);

    const result: Record<string, { total: number; count: number; percentage: number }> = {};
    Object.entries(categoryTotals).forEach(([category, data]) => {
      result[category] = {
        total: data.total,
        count: data.count,
        percentage: totalSpending > 0 ? (data.total / totalSpending) * 100 : 0
      };
    });

    return result;
  }

  calculateMonthlySpending(expenses: any[]): Array<{ month: string; amount: number }> {
    // This method is now handled by TrendAnalysisService, but keeping for backward compatibility
    const monthlyData: Record<string, number> = {};

    expenses.forEach(expense => {
      const date = new Date(expense.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = 0;
      }
      monthlyData[monthKey] += expense.amount;
    });

    return Object.entries(monthlyData)
      .map(([month, amount]) => ({ month, amount }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6); // Last 6 months
  }

  calculateSpendingTrend(monthlyData: Array<{ month: string; amount: number }>): string {
    if (monthlyData.length < 2) return 'insufficient data';

    const recent = monthlyData.slice(-3);
    const earlier = monthlyData.slice(-6, -3);

    if (earlier.length === 0) return 'insufficient data';

    const recentAvg = recent.reduce((sum: number, month: any) => sum + month.amount, 0) / recent.length;
    const earlierAvg = earlier.reduce((sum: number, month: any) => sum + month.amount, 0) / earlier.length;

    const change = ((recentAvg - earlierAvg) / earlierAvg) * 100;

    if (change > 10) return 'increasing';
    if (change < -10) return 'decreasing';
    return 'stable';
  }

  private getFallbackPredictions(expenses: any[], months: number): any {
    return this.spendingPredictionService['getFallbackPredictions'](expenses, months);
  }

  private getFallbackSavingsAnalysis(expenses: any[]): any {
    return this.savingsAnalysisService['getFallbackSavingsAnalysis'](expenses);
  }
}