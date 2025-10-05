import { OpenAIClient } from './OpenAIClient';

export class AIPredictionService {
  private openAIClient: OpenAIClient;

  constructor() {
    this.openAIClient = OpenAIClient.getInstance();
  }

  async predictFutureSpending(expenses: any[], months: number = 3): Promise<any> {
    try {
      if (!this.openAIClient.isConfigured()) {
        return this.getFallbackPredictions(expenses, months);
      }

      const monthlySpending = this.calculateMonthlySpending(expenses);
      const averageMonthly = monthlySpending.reduce((sum, month) => sum + month.amount, 0) / monthlySpending.length;
      const trend = this.calculateSpendingTrend(monthlySpending);

      const prompt = `
Based on the following spending history, predict spending for the next ${months} months:

Monthly spending history:
${monthlySpending.map(month => `${month.month}: ₹${month.amount.toFixed(2)}`).join('\n')}

Average monthly spending: ₹${averageMonthly.toFixed(2)}
Trend: ${trend}

Provide predictions in JSON format:
{
  "predictions": [
    {
      "month": "Month name",
      "predictedAmount": 0,
      "confidence": "high|medium|low",
      "reasoning": "Brief explanation"
    }
  ],
  "overallTrend": "increasing|decreasing|stable",
  "recommendations": ["rec1", "rec2"]
}
`;

      const messages = [
        {
          role: 'system',
          content: 'You are a financial analyst making spending predictions. Respond with valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ];

      const response = await this.openAIClient.makeRequest(messages);

      try {
        return JSON.parse(response);
      } catch (parseError) {
        console.error('Failed to parse spending predictions:', parseError);
        return this.getFallbackPredictions(expenses, months);
      }
    } catch (error) {
      console.error('Spending prediction failed:', error);
      return this.getFallbackPredictions(expenses, months);
    }
  }

  private calculateMonthlySpending(expenses: any[]): Array<{ month: string; amount: number }> {
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

  private calculateSpendingTrend(monthlyData: Array<{ month: string; amount: number }>): string {
    if (monthlyData.length < 2) return 'insufficient data';

    const recent = monthlyData.slice(-3);
    const earlier = monthlyData.slice(-6, -3);

    if (earlier.length === 0) return 'insufficient data';

    const recentAvg = recent.reduce((sum, month) => sum + month.amount, 0) / recent.length;
    const earlierAvg = earlier.reduce((sum, month) => sum + month.amount, 0) / earlier.length;

    const change = ((recentAvg - earlierAvg) / earlierAvg) * 100;

    if (change > 10) return 'increasing';
    if (change < -10) return 'decreasing';
    return 'stable';
  }

  private getFallbackPredictions(expenses: any[], months: number): any {
    const monthlySpending = this.calculateMonthlySpending(expenses);
    const averageMonthly = monthlySpending.length > 0
      ? monthlySpending.reduce((sum, month) => sum + month.amount, 0) / monthlySpending.length
      : 0;

    const predictions = [];
    for (let i = 1; i <= months; i++) {
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + i);
      const monthName = futureDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

      predictions.push({
        month: monthName,
        predictedAmount: averageMonthly,
        confidence: 'medium',
        reasoning: 'Based on historical average spending'
      });
    }

    return {
      predictions,
      overallTrend: 'stable',
      recommendations: [
        'Monitor actual spending against predictions',
        'Adjust budgets based on predicted amounts'
      ]
    };
  }

  async analyzeSavingsPotential(expenses: any[]): Promise<any> {
    try {
      if (!this.openAIClient.isConfigured()) {
        return this.getFallbackSavingsAnalysis(expenses);
      }

      const categorySpending = this.groupExpensesByCategory(expenses);
      const totalSpending = expenses.reduce((sum, expense) => sum + expense.amount, 0);

      const prompt = `
Analyze savings potential based on spending patterns:

Category spending:
${Object.entries(categorySpending).map(([category, data]: [string, any]) =>
  `- ${category}: ₹${data.total.toFixed(2)} (${data.percentage.toFixed(1)}% of total)`
).join('\n')}

Total spending: ₹${totalSpending.toFixed(2)}

Identify areas for potential savings and provide specific recommendations.

Respond in JSON format:
{
  "savingsPotential": 0,
  "savingsCategories": [
    {
      "category": "category name",
      "currentSpending": 0,
      "potentialSavings": 0,
      "percentage": 0,
      "reasoning": "why this category has savings potential"
    }
  ],
  "recommendations": ["rec1", "rec2", "rec3"],
  "monthlySavingsGoal": 0
}
`;

      const messages = [
        {
          role: 'system',
          content: 'You are a savings expert analyzing spending patterns for optimization. Respond with valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ];

      const response = await this.openAIClient.makeRequest(messages);

      try {
        return JSON.parse(response);
      } catch (parseError) {
        console.error('Failed to parse savings analysis:', parseError);
        return this.getFallbackSavingsAnalysis(expenses);
      }
    } catch (error) {
      console.error('Savings analysis failed:', error);
      return this.getFallbackSavingsAnalysis(expenses);
    }
  }

  private groupExpensesByCategory(expenses: any[]): Record<string, { total: number; count: number; percentage: number }> {
    const categoryTotals: Record<string, { total: number; count: number }> = {};

    expenses.forEach(expense => {
      const category = expense.category || 'Other';
      if (!categoryTotals[category]) {
        categoryTotals[category] = { total: 0, count: 0 };
      }
      categoryTotals[category].total += expense.amount;
      categoryTotals[category].count += 1;
    });

    const totalSpending = Object.values(categoryTotals).reduce((sum, cat) => sum + cat.total, 0);

    const result: Record<string, { total: number; count: number; percentage: number }> = {};
    Object.entries(categoryTotals).forEach(([category, data]) => {
      result[category] = {
        ...data,
        percentage: (data.total / totalSpending) * 100
      };
    });

    return result;
  }

  private getFallbackSavingsAnalysis(expenses: any[]): any {
    const totalSpending = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const estimatedSavings = totalSpending * 0.1; // 10% potential savings

    return {
      savingsPotential: estimatedSavings,
      savingsCategories: [
        {
          category: 'General',
          currentSpending: totalSpending,
          potentialSavings: estimatedSavings,
          percentage: 10,
          reasoning: 'General spending optimization potential'
        }
      ],
      recommendations: [
        'Track expenses daily to identify spending patterns',
        'Set specific budgets for different categories',
        'Look for subscriptions or recurring expenses to optimize'
      ],
      monthlySavingsGoal: estimatedSavings / 12
    };
  }
}