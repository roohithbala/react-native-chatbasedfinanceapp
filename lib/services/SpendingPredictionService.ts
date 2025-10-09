import { OpenAIClient } from './OpenAIClient';
import TrendAnalysisService from './TrendAnalysisService';

export class SpendingPredictionService {
  private openAIClient: OpenAIClient;
  private trendService: TrendAnalysisService;

  constructor() {
    this.openAIClient = OpenAIClient.getInstance();
    this.trendService = new TrendAnalysisService();
  }

  async predictFutureSpending(expenses: any[], months: number = 3): Promise<any> {
    try {
      if (!this.openAIClient.isConfigured()) {
        return this.getFallbackPredictions(expenses, months);
      }

      const monthlySpending = this.trendService.calculateMonthlySpending(expenses);
      const averageMonthly = monthlySpending.reduce((sum: number, month: any) => sum + month.amount, 0) / monthlySpending.length;
      const trend = this.trendService.calculateSpendingTrend(monthlySpending);

      const prompt = `
Based on the following spending history, predict spending for the next ${months} months:

Monthly spending history:
${monthlySpending.map((month: any) => `${month.month}: ₹${month.amount.toFixed(2)}`).join('\n')}

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

  private getFallbackPredictions(expenses: any[], months: number): any {
    const monthlySpending = this.trendService.calculateMonthlySpending(expenses);
    const averageMonthly = monthlySpending.length > 0
      ? monthlySpending.reduce((sum: number, month: any) => sum + month.amount, 0) / monthlySpending.length
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
}