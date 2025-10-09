import { FinancialInsight, SpendingAnalysis } from './types';

export class FallbackInsightsGenerator {
  static generateInsights(expenses: any[], budgets: any = {}): SpendingAnalysis {
    const totalSpending = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const categoryCount = new Set(expenses.map(e => e.category)).size;

    const fallbackInsights: FinancialInsight[] = [
      {
        id: 'fallback_1',
        title: 'Spending Overview',
        description: `You've spent ₹${totalSpending.toFixed(2)} across ${categoryCount} categories this period.`,
        type: 'tip',
        icon: '💰',
      },
      {
        id: 'fallback_2',
        title: 'Track Your Expenses',
        description: 'Continue tracking your expenses to identify spending patterns and opportunities for savings.',
        type: 'tip',
        icon: '📊',
      },
    ];

    // Add budget-related insight if budgets exist
    if (Object.keys(budgets).length > 0) {
      const budgetCategories = Object.keys(budgets);
      const budgetedSpending = expenses
        .filter(e => budgetCategories.includes(e.category))
        .reduce((sum, e) => sum + e.amount, 0);

      fallbackInsights.push({
        id: 'fallback_3',
        title: 'Budget Tracking',
        description: `You've set budgets for ${budgetCategories.length} categories. Keep monitoring your spending against these limits.`,
        type: 'warning',
        icon: '🎯',
      });
    }

    return {
      insights: fallbackInsights,
      predictions: [
        'Based on current spending patterns, you may spend similar amounts next month.',
        'Consider setting specific savings goals to improve financial health.',
      ],
      recommendations: [
        'Review your expenses weekly to identify unnecessary spending.',
        'Set realistic budgets for different categories.',
        'Look for opportunities to reduce recurring expenses.',
      ],
    };
  }
}