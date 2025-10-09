import { OpenAIClient } from './OpenAIClient';
import ExpenseFilter from './ExpenseFilter';

export class FinancialSummaryService {
  private openAIClient: OpenAIClient;

  constructor() {
    this.openAIClient = OpenAIClient.getInstance();
  }

  async generateSummary(expenses: any[], period: string = 'month'): Promise<any> {
    try {
      if (!this.openAIClient.isConfigured()) {
        return this.getFallbackSummary(expenses, period);
      }

      const periodExpenses = ExpenseFilter.filterByPeriod(expenses, period);
      const totalSpending = periodExpenses.reduce((sum: number, expense: any) => sum + expense.amount, 0);
      const categoryBreakdown = periodExpenses.reduce((acc: Record<string, number>, expense: any) => {
        const category = expense.category || 'Other';
        acc[category] = (acc[category] || 0) + expense.amount;
        return acc;
      }, {} as Record<string, number>);

      const prompt = `
Create a financial summary for the ${period} period:

Total Spending: ₹${totalSpending.toFixed(2)}
Category Breakdown:
${Object.entries(categoryBreakdown).map(([cat, amount]) =>
  `- ${cat}: ₹${(amount as number).toFixed(2)}`
).join('\n')}

Number of transactions: ${periodExpenses.length}

Provide a concise summary in JSON format:
{
  "summary": "Brief overview of financial activity",
  "keyInsights": ["insight1", "insight2", "insight3"],
  "trends": "Any notable spending trends"
}
`;

      const messages = [
        {
          role: 'system',
          content: 'You are a financial analyst creating concise summaries. Respond with valid JSON.'
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
        console.error('Failed to parse financial summary:', parseError);
        return this.getFallbackSummary(expenses, period);
      }
    } catch (error) {
      console.error('Financial summary failed:', error);
      return this.getFallbackSummary(expenses, period);
    }
  }

  private getFallbackSummary(expenses: any[], period: string): any {
    const periodExpenses = ExpenseFilter.filterByPeriod(expenses, period);
    const totalSpending = periodExpenses.reduce((sum: number, expense: any) => sum + expense.amount, 0);

    return {
      summary: `Total spending: ₹${totalSpending.toFixed(2)} across ${periodExpenses.length} transactions.`,
      keyInsights: [
        'Continue monitoring your expenses regularly.',
        'Consider categorizing expenses for better insights.',
      ],
      trends: 'More data needed for trend analysis.',
    };
  }
}