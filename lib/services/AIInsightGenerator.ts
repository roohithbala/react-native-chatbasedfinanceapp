import { OpenAIClient } from './OpenAIClient';

export class AIInsightGenerator {
  private openAIClient: OpenAIClient;

  constructor() {
    this.openAIClient = OpenAIClient.getInstance();
  }

  async getEmotionalAnalysis(expenses: any[]): Promise<any> {
    try {
      if (!this.openAIClient.isConfigured()) {
        return this.getFallbackEmotionalAnalysis();
      }

      const recentExpenses = expenses.slice(-10); // Last 10 expenses
      const totalAmount = recentExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      const avgAmount = totalAmount / recentExpenses.length;

      const prompt = `
Analyze the emotional spending patterns based on these recent transactions:
${recentExpenses.map(expense =>
  `- ${expense.description}: ₹${expense.amount} (${expense.category})`
).join('\n')}

Average transaction: ₹${avgAmount.toFixed(2)}

Provide emotional analysis in JSON format:
{
  "emotionalState": "calm|stressed|impulsive|satisfied",
  "analysis": "Brief analysis of spending emotions",
  "suggestions": ["suggestion1", "suggestion2"]
}
`;

      const messages = [
        {
          role: 'system',
          content: 'You are a financial psychologist analyzing spending emotions. Respond with valid JSON.'
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
        console.error('Failed to parse emotional analysis:', parseError);
        return this.getFallbackEmotionalAnalysis();
      }
    } catch (error) {
      console.error('Emotional analysis failed:', error);
      return this.getFallbackEmotionalAnalysis();
    }
  }

  private getFallbackEmotionalAnalysis(): any {
    return {
      emotionalState: 'neutral',
      analysis: 'Unable to analyze emotional spending patterns at this time.',
      suggestions: ['Continue tracking expenses for better insights.'],
    };
  }

  async getFinancialSummary(expenses: any[], period: string = 'month'): Promise<any> {
    try {
      if (!this.openAIClient.isConfigured()) {
        return this.getFallbackFinancialSummary(expenses, period);
      }

      const periodExpenses = this.filterExpensesByPeriod(expenses, period);
      const totalSpending = periodExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      const categoryBreakdown = periodExpenses.reduce((acc, expense) => {
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
        return this.getFallbackFinancialSummary(expenses, period);
      }
    } catch (error) {
      console.error('Financial summary failed:', error);
      return this.getFallbackFinancialSummary(expenses, period);
    }
  }

  private getFallbackFinancialSummary(expenses: any[], period: string): any {
    const periodExpenses = this.filterExpensesByPeriod(expenses, period);
    const totalSpending = periodExpenses.reduce((sum, expense) => sum + expense.amount, 0);

    return {
      summary: `Total spending: ₹${totalSpending.toFixed(2)} across ${periodExpenses.length} transactions.`,
      keyInsights: [
        'Continue monitoring your expenses regularly.',
        'Consider categorizing expenses for better insights.',
      ],
      trends: 'More data needed for trend analysis.',
    };
  }

  private filterExpensesByPeriod(expenses: any[], period: string): any[] {
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

  async generateCustomInsights(expenses: any[], focusArea: string): Promise<any> {
    try {
      if (!this.openAIClient.isConfigured()) {
        return { insights: ['AI insights not available. Please configure OpenAI API key.'] };
      }

      const prompt = `
Generate insights focused on: ${focusArea}

Expense data:
${expenses.slice(-20).map(expense =>
  `- ${expense.description}: ₹${expense.amount} (${expense.category}) on ${new Date(expense.createdAt).toLocaleDateString()}`
).join('\n')}

Provide insights in JSON format:
{
  "insights": ["insight1", "insight2", "insight3"],
  "recommendations": ["rec1", "rec2"]
}
`;

      const messages = [
        {
          role: 'system',
          content: `You are a financial advisor specializing in ${focusArea}. Provide focused insights.`
        },
        {
          role: 'user',
          content: prompt
        }
      ];

      const response = await this.openAIClient.makeRequest(messages);

      try {
        return JSON.parse(response);
      } catch {
        return {
          insights: [`Consider focusing on ${focusArea} in your spending habits.`],
          recommendations: ['Track expenses regularly for better insights.']
        };
      }
    } catch (error) {
      console.error('Custom insights generation failed:', error);
      return {
        insights: ['Unable to generate custom insights at this time.'],
        recommendations: ['Continue tracking your expenses.']
      };
    }
  }
}