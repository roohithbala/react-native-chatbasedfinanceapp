import { OpenAIClient } from './OpenAIClient';
import { FinancialInsight, SpendingAnalysis } from './types';

export class AIAnalysisEngine {
  private openAIClient: OpenAIClient;

  constructor() {
    this.openAIClient = OpenAIClient.getInstance();
  }

  async analyzeSpending(expenses: any[], budgets: any = {}): Promise<SpendingAnalysis> {
    try {
      if (!this.openAIClient.isConfigured()) {
        return this.getFallbackInsights(expenses, budgets);
      }

      // Prepare expense data for analysis
      const expenseSummary: Record<string, { total: number; count: number; items: any[] }> = expenses.reduce((acc, expense) => {
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

      const totalSpending = Object.values(expenseSummary).reduce((sum: number, cat) => sum + cat.total, 0);
      const categories = Object.keys(expenseSummary);

      const prompt = `
You are a financial advisor analyzing a user's spending patterns. Based on the following data, provide 3-4 insightful observations and 2-3 actionable recommendations.

Expense Summary:
${Object.entries(expenseSummary).map(([category, data]: [string, any]) =>
  `- ${category}: ₹${data.total.toFixed(2)} (${data.count} transactions)`
).join('\n')}

Total Spending: ₹${totalSpending.toFixed(2)}
Categories: ${categories.join(', ')}

${budgets && Object.keys(budgets).length > 0 ?
  `Budgets: ${Object.entries(budgets).map(([cat, amount]) => `${cat}: ₹${amount}`).join(', ')}` :
  'No budgets set'
}

Please respond in JSON format with this structure:
{
  "insights": [
    {
      "title": "Brief title",
      "description": "Detailed observation or insight",
      "type": "warning|success|tip|prediction",
      "icon": "emoji"
    }
  ],
  "predictions": ["prediction1", "prediction2"],
  "recommendations": ["recommendation1", "recommendation2", "recommendation3"]
}

Focus on:
- Spending patterns and trends
- Budget adherence (if budgets exist)
- Potential savings opportunities
- Financial health indicators
- Practical advice for better money management
`;

      const messages = [
        {
          role: 'system',
          content: 'You are a helpful financial advisor providing insights on spending patterns. Always respond with valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ];

      const response = await this.openAIClient.makeRequest(messages);

      try {
        const parsedResponse = JSON.parse(response);

        // Validate response structure
        if (!parsedResponse.insights || !Array.isArray(parsedResponse.insights)) {
          throw new Error('Invalid response structure');
        }

        // Add IDs to insights
        const insightsWithIds = parsedResponse.insights.map((insight: any, index: number) => ({
          ...insight,
          id: `insight_${Date.now()}_${index}`,
        }));

        return {
          insights: insightsWithIds,
          predictions: parsedResponse.predictions || [],
          recommendations: parsedResponse.recommendations || [],
        };
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError);
        // Return fallback insights if parsing fails
        return this.getFallbackInsights(expenses, budgets);
      }
    } catch (error) {
      console.error('AI analysis failed:', error);
      return this.getFallbackInsights(expenses, budgets);
    }
  }

  private getFallbackInsights(expenses: any[], budgets: any = {}): SpendingAnalysis {
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