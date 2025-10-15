import { Alert } from 'react-native';

/**
 * IMPORTANT: Frontend AI analysis is disabled to prevent API key exposure.
 * 
 * This app uses Google Gemini AI on the BACKEND for AI-powered insights.
 * Users can access AI features via the @predict command in chat.
 * 
 * Why disabled:
 * - Frontend API keys would be exposed in the React Native bundle
 * - Backend handles AI securely with environment variables
 * - @predict command provides the same insights via backend
 * 
 * To use AI features: Type "@predict" in any chat
 */

// OpenAI API configuration (DISABLED - kept for reference only)
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
    // NOTE: Frontend AI analysis is disabled. 
    // Use the backend @predict command in chat for AI-powered insights via Google Gemini.
    console.log('ℹ️ Frontend AI analysis disabled. Use @predict command in chat for AI insights.');
    return this.getFallbackInsights(expenses, budgets);
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
    // NOTE: Frontend AI analysis is disabled.
    console.log('ℹ️ Frontend emotional analysis disabled. Use @predict command in chat.');
    return {
      emotionalState: 'neutral',
      analysis: 'Use the @predict command in chat to get AI-powered spending insights from Google Gemini.',
      suggestions: ['Type @predict in any chat to get detailed AI analysis of your spending patterns.'],
    };
  }

  async getFinancialSummary(expenses: any[], period: string = 'month'): Promise<any> {
    // NOTE: Frontend AI analysis is disabled.
    const periodExpenses = this.filterExpensesByPeriod(expenses, period);
    const totalSpending = periodExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    console.log('ℹ️ Frontend financial summary disabled. Use @predict command in chat.');
    return {
      summary: `Total spending: ₹${totalSpending.toFixed(2)} across ${periodExpenses.length} transactions for the ${period} period. For AI-powered insights, use @predict command in chat.`,
      keyInsights: [
        'Use @predict in chat for detailed AI analysis powered by Google Gemini',
        'Continue monitoring your expenses regularly.',
        'Consider categorizing expenses for better insights.',
      ],
      trends: 'Use @predict command to get AI-powered trend analysis.',
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
}

export const freeAIService = new FreeAIService();
export default freeAIService;