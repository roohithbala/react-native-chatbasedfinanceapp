import { Alert } from 'react-native';

// OpenAI API configuration
const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY || '';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

export interface FinancialInsight {
  id: string;
  title: string;
  description: string;
  type: 'warning' | 'success' | 'tip' | 'prediction';
  icon: string;
}

export interface SpendingAnalysis {
  insights: FinancialInsight[];
  predictions: string[];
  recommendations: string[];
}

class FreeAIService {
  private async makeOpenAIRequest(messages: any[]): Promise<any> {
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured. Please set EXPO_PUBLIC_OPENAI_API_KEY in your environment variables.');
    }

    try {
      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: messages,
          max_tokens: 1000,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('OpenAI API request failed:', error);
      throw error;
    }
  }

  async analyzeSpending(expenses: any[], budgets: any = {}): Promise<SpendingAnalysis> {
    try {
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
  `Budgets: ${Object.entries(budgets).map(([cat, amount]) => `${cat}: ₹${amount}`).join(', ')}` : 'No budgets set'
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

      const response = await this.makeOpenAIRequest(messages);

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
      Alert.alert(
        'AI Analysis Unavailable',
        'Unable to analyze spending patterns right now. Using basic insights instead.',
        [{ text: 'OK' }]
      );
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

  async getEmotionalAnalysis(expenses: any[]): Promise<any> {
    try {
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

      const response = await this.makeOpenAIRequest(messages);

      try {
        return JSON.parse(response);
      } catch (parseError) {
        console.error('Failed to parse emotional analysis:', parseError);
        return {
          emotionalState: 'neutral',
          analysis: 'Unable to analyze emotional spending patterns at this time.',
          suggestions: ['Continue tracking expenses for better insights.'],
        };
      }
    } catch (error) {
      console.error('Emotional analysis failed:', error);
      return {
        emotionalState: 'neutral',
        analysis: 'Emotional analysis unavailable.',
        suggestions: ['Keep tracking your expenses regularly.'],
      };
    }
  }

  async getFinancialSummary(expenses: any[], period: string = 'month'): Promise<any> {
    try {
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

      const response = await this.makeOpenAIRequest(messages);

      try {
        return JSON.parse(response);
      } catch (parseError) {
        console.error('Failed to parse financial summary:', parseError);
        return {
          summary: `Total spending: ₹${totalSpending.toFixed(2)} across ${periodExpenses.length} transactions.`,
          keyInsights: [
            'Continue monitoring your expenses regularly.',
            'Consider categorizing expenses for better insights.',
          ],
          trends: 'More data needed for trend analysis.',
        };
      }
    } catch (error) {
      console.error('Financial summary failed:', error);
      return {
        summary: 'Financial summary unavailable.',
        keyInsights: ['Keep tracking your expenses.'],
        trends: 'Unable to analyze trends.',
      };
    }
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
}

export const freeAIService = new FreeAIService();
export default freeAIService;