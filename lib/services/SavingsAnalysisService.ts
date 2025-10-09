import { OpenAIClient } from './OpenAIClient';
import TrendAnalysisService from './TrendAnalysisService';

export class SavingsAnalysisService {
  private openAIClient: OpenAIClient;
  private trendService: TrendAnalysisService;

  constructor() {
    this.openAIClient = OpenAIClient.getInstance();
    this.trendService = new TrendAnalysisService();
  }

  async analyzeSavingsPotential(expenses: any[], income?: number): Promise<any> {
    try {
      if (!this.openAIClient.isConfigured()) {
        return this.getFallbackSavingsAnalysis(expenses, income);
      }

      const monthlySpending = this.trendService.calculateMonthlySpending(expenses);
      const averageMonthly = monthlySpending.length > 0
        ? monthlySpending.reduce((sum: number, month: any) => sum + month.amount, 0) / monthlySpending.length
        : 0;

      const groupedExpenses = this.trendService.groupExpensesByCategory(expenses);
      const topCategories = Object.entries(groupedExpenses)
        .map(([category, categoryExpenses]) => ({
          category,
          total: categoryExpenses.reduce((sum: number, exp: any) => sum + exp.amount, 0),
          count: categoryExpenses.length
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);

      const prompt = `
Analyze savings potential based on the following financial data:

Monthly spending average: ₹${averageMonthly.toFixed(2)}
${income ? `Monthly income: ₹${income.toFixed(2)}` : 'Income not provided'}

Top spending categories:
${topCategories.map(cat => `${cat.category}: ₹${cat.total.toFixed(2)} (${cat.count} transactions)`).join('\n')}

Provide savings analysis in JSON format:
{
  "potentialSavings": 0,
  "savingsPercentage": 0,
  "recommendations": [
    {
      "category": "Category name",
      "currentSpending": 0,
      "suggestedReduction": 0,
      "potentialSavings": 0,
      "reasoning": "Brief explanation"
    }
  ],
  "monthlySavingsGoal": 0,
  "timeframe": "3-6 months"
}
`;

      const messages = [
        {
          role: 'system',
          content: 'You are a financial advisor analyzing savings potential. Respond with valid JSON.'
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
        return this.getFallbackSavingsAnalysis(expenses, income);
      }
    } catch (error) {
      console.error('Savings analysis failed:', error);
      return this.getFallbackSavingsAnalysis(expenses, income);
    }
  }

  private getFallbackSavingsAnalysis(expenses: any[], income?: number): any {
    const monthlySpending = this.trendService.calculateMonthlySpending(expenses);
    const averageMonthly = monthlySpending.length > 0
      ? monthlySpending.reduce((sum: number, month: any) => sum + month.amount, 0) / monthlySpending.length
      : 0;

    const groupedExpenses = this.trendService.groupExpensesByCategory(expenses);
    const topCategories = Object.entries(groupedExpenses)
      .map(([category, categoryExpenses]) => ({
        category,
        total: categoryExpenses.reduce((sum: number, exp: any) => sum + exp.amount, 0),
        count: categoryExpenses.length
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 3);

    const potentialSavings = averageMonthly * 0.15; // 15% of spending
    const recommendations = topCategories.map(cat => ({
      category: cat.category,
      currentSpending: cat.total,
      suggestedReduction: cat.total * 0.1, // 10% reduction
      potentialSavings: cat.total * 0.1,
      reasoning: `Reduce spending in ${cat.category} by cutting non-essential expenses`
    }));

    return {
      potentialSavings,
      savingsPercentage: 15,
      recommendations,
      monthlySavingsGoal: potentialSavings,
      timeframe: '3-6 months'
    };
  }
}