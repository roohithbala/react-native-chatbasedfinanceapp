import { Alert } from 'react-native';

/**
 * OpenRouter AI Service for advanced financial analysis
 * Based on the Python Flask implementation for log analysis
 * Adapted for React Native financial app
 */

// OpenRouter API configuration
const OPENROUTER_API_KEY = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY || '';
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

export interface FinancialInsight {
  id: string;
  title: string;
  description: string;
  type: 'warning' | 'success' | 'tip' | 'prediction' | 'danger' | 'info';
  icon: string;
  severity?: 'Low' | 'Medium' | 'High';
}

export interface SpendingAnalysis {
  insights: FinancialInsight[];
  predictions: string[];
  recommendations: string[];
  emotionalAnalysis?: {
    emotionalState: string;
    analysis: string;
    suggestions: string[];
  };
  summary?: {
    summary: string;
    keyInsights: string[];
    trends: string;
  };
}

export interface LogAnalysis {
  issue_type: string;
  severity: string;
  root_cause: string;
  suggested_fix: string;
}

class OpenRouterAIService {
  public async makeOpenRouterRequest(messages: any[], model: string = "x-ai/grok-4.1-fast:free"): Promise<any> {
    if (!OPENROUTER_API_KEY) {
      throw new Error('OpenRouter API key not configured. Please set EXPO_PUBLIC_OPENROUTER_API_KEY in your environment variables.');
    }

    try {
      const requestBody: any = {
        model: model,
        messages: messages,
        temperature: 0.1,
        max_tokens: 1500,
      };

      // Enable reasoning for Grok models
      if (model.includes('grok')) {
        requestBody.reasoning = { enabled: true };
      }

      const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Referer': 'https://github.com/your-repo/finance-app',
          'X-Title': 'Finance App AI Assistant',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OpenRouter API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      // Return the full message object to preserve reasoning_details
      return data.choices[0]?.message || {};
    } catch (error) {
      console.error('OpenRouter API request failed:', error);
      throw error;
    }
  }

  /**
   * Advanced spending analysis using OpenRouter AI
   */
  async analyzeSpending(expenses: any[], budgets: any = {}): Promise<SpendingAnalysis> {
    if (!OPENROUTER_API_KEY) {
      console.log('ℹ️ OpenRouter API key not configured, using fallback analysis');
      return this.getFallbackInsights(expenses, budgets);
    }

    try {
      const totalSpending = expenses.reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0);
      const categoryCount = new Set(expenses.map(e => e.category)).size;
      const averageTransaction = expenses.length > 0 ? totalSpending / expenses.length : 0;

      // Prepare expense data for AI analysis
      const categoryBreakdown: { [key: string]: { total: number; count: number; average: number } } = {};
      const monthlyTrends: { [key: string]: { total: number; count: number } } = {};
      const recentExpenses = expenses.slice(0, 20); // Last 20 expenses

      expenses.forEach(expense => {
        const category = expense.category || 'Other';
        const date = new Date(expense.createdAt);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        // Category breakdown
        if (!categoryBreakdown[category]) {
          categoryBreakdown[category] = { total: 0, count: 0, average: 0 };
        }
        categoryBreakdown[category].total += Number(expense.amount) || 0;
        categoryBreakdown[category].count += 1;

        // Monthly trends
        if (!monthlyTrends[monthKey]) {
          monthlyTrends[monthKey] = { total: 0, count: 0 };
        }
        monthlyTrends[monthKey].total += Number(expense.amount) || 0;
        monthlyTrends[monthKey].count += 1;
      });

      // Calculate averages
      Object.keys(categoryBreakdown).forEach(cat => {
        categoryBreakdown[cat].average = categoryBreakdown[cat].total / categoryBreakdown[cat].count;
      });

      const prompt = `You are a financial advisor AI analyzing a user's spending patterns. Provide detailed insights in JSON format.

User's spending data:
- Total transactions: ${expenses.length}
- Total spending: ₹${totalSpending.toFixed(2)}
- Categories used: ${categoryCount}
- Average transaction: ₹${averageTransaction.toFixed(2)}

Category breakdown:
${Object.entries(categoryBreakdown).map(([cat, data]: [string, any]) =>
  `- ${cat}: ₹${data.total.toFixed(2)} (${data.count} transactions, avg: ₹${data.average.toFixed(2)})`
).join('\n')}

Monthly trends:
${Object.entries(monthlyTrends).slice(-6).map(([month, data]: [string, any]) =>
  `- ${month}: ₹${data.total.toFixed(2)} (${data.count} transactions)`
).join('\n')}

Recent expenses (last 5):
${recentExpenses.slice(0, 5).map(exp =>
  `- ${exp.description || 'Unknown'}: ₹${(Number(exp.amount) || 0).toFixed(2)} (${exp.category || 'Other'}) - ${new Date(exp.createdAt).toLocaleDateString()}`
).join('\n')}

${Object.keys(budgets).length > 0 ? `Budget information:\n${Object.entries(budgets).map(([cat, limit]: [string, any]) => `- ${cat}: ₹${limit}`).join('\n')}` : 'No budget information available'}

Return a JSON object with these keys:
- insights: Array of insight objects with {title, description, type, severity}
- predictions: Array of prediction strings
- recommendations: Array of recommendation strings
- emotionalAnalysis: {emotionalState, analysis, suggestions}
- summary: {summary, keyInsights, trends}

Types for insights: 'warning', 'success', 'tip', 'prediction', 'danger', 'info'
Severity for insights: 'Low', 'Medium', 'High'`;

      const aiResponse = await this.makeOpenRouterRequest([
        { role: "user", content: prompt }
      ]);

      // Parse the JSON response from the message content
      const parsedResponse = this.parseAIResponse(aiResponse.content || aiResponse);

      return {
        insights: parsedResponse.insights || this.getFallbackInsights(expenses, budgets).insights,
        predictions: parsedResponse.predictions || [],
        recommendations: parsedResponse.recommendations || [],
        emotionalAnalysis: parsedResponse.emotionalAnalysis,
        summary: parsedResponse.summary
      };

    } catch (error) {
      console.error('OpenRouter spending analysis failed:', error);
      return this.getFallbackInsights(expenses, budgets);
    }
  }

  /**
   * Analyze financial logs or error patterns
   */
  async analyzeFinancialLogs(logs: string[]): Promise<LogAnalysis[]> {
    if (!OPENROUTER_API_KEY || logs.length === 0) {
      return [];
    }

    try {
      const combinedLogs = logs.join('\n\n---\n\n');

      const prompt = `Analyze these financial application logs for issues, errors, and patterns. Return analysis in JSON format.

Logs to analyze:
${combinedLogs}

Return a JSON array of analysis objects with these keys for each issue found:
- issue_type: Type of issue (e.g., "Authentication Error", "Database Issue", "Payment Failure")
- severity: "High", "Medium", or "Low"
- root_cause: Root cause explanation
- suggested_fix: Suggested fix or resolution

Only include actual issues found in the logs. If no issues found, return empty array.`;

      const aiResponse = await this.makeOpenRouterRequest([
        { role: "user", content: prompt }
      ]);

      return this.parseLogAnalysisResponse(aiResponse.content || aiResponse);
    } catch (error) {
      console.error('Log analysis failed:', error);
      return [];
    }
  }

  /**
   * Get emotional analysis of spending patterns
   */
  async getEmotionalAnalysis(expenses: any[]): Promise<any> {
    if (!OPENROUTER_API_KEY) {
      return {
        emotionalState: 'neutral',
        analysis: 'OpenRouter API key not configured. Enable AI analysis by setting EXPO_PUBLIC_OPENROUTER_API_KEY.',
        suggestions: ['Configure OpenRouter API key for advanced AI insights'],
      };
    }

    try {
      const spendingPatterns = this.analyzeSpendingPatterns(expenses);

      const prompt = `Based on these spending patterns, analyze the user's emotional state and financial behavior:

${spendingPatterns}

Return a JSON object with:
- emotionalState: One word describing emotional state (e.g., "anxious", "confident", "frugal", "impulsive")
- analysis: Brief analysis (2-3 sentences)
- suggestions: Array of 3-5 actionable suggestions`;

      const aiResponse = await this.makeOpenRouterRequest([
        { role: "user", content: prompt }
      ]);

      return this.parseEmotionalResponse(aiResponse.content || aiResponse);
    } catch (error) {
      console.error('Emotional analysis failed:', error);
      return {
        emotionalState: 'neutral',
        analysis: 'Unable to analyze emotional patterns at this time.',
        suggestions: ['Continue tracking expenses for better insights'],
      };
    }
  }

  /**
   * Get financial summary with AI insights
   */
  async getFinancialSummary(expenses: any[], period: string = 'month'): Promise<any> {
    if (!OPENROUTER_API_KEY) {
      const periodExpenses = this.filterExpensesByPeriod(expenses, period);
      const totalSpending = periodExpenses.reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0);

      return {
        summary: `Total spending: ₹${totalSpending.toFixed(2)} across ${periodExpenses.length} transactions for the ${period} period.`,
        keyInsights: [
          'Configure OpenRouter API key for AI-powered insights',
          'Continue monitoring your expenses regularly',
          'Consider categorizing expenses for better analysis',
        ],
        trends: 'Enable AI analysis to get detailed trend insights.',
      };
    }

    try {
      const periodExpenses = this.filterExpensesByPeriod(expenses, period);
      const spendingData = this.analyzeSpendingPatterns(periodExpenses);

      const prompt = `Create a comprehensive financial summary for this ${period} period:

${spendingData}

Return a JSON object with:
- summary: One paragraph summary
- keyInsights: Array of 4-6 key insights
- trends: Analysis of spending trends and patterns`;

      const aiResponse = await this.makeOpenRouterRequest([
        { role: "user", content: prompt }
      ]);

      return this.parseSummaryResponse(aiResponse.content || aiResponse);
    } catch (error) {
      console.error('Financial summary failed:', error);
      const periodExpenses = this.filterExpensesByPeriod(expenses, period);
      const totalSpending = periodExpenses.reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0);

      return {
        summary: `Total spending: ₹${totalSpending.toFixed(2)} across ${periodExpenses.length} transactions for the ${period} period.`,
        keyInsights: [
          'Unable to generate AI insights at this time',
          'Continue monitoring your expenses regularly',
          'Consider categorizing expenses for better analysis',
        ],
        trends: 'Basic trend analysis unavailable.',
      };
    }
  }

  /**
   * Continue a conversation with preserved reasoning context
   */
  public async continueReasoningConversation(messages: any[], model: string = "x-ai/grok-4.1-fast:free"): Promise<any> {
    if (!OPENROUTER_API_KEY) {
      throw new Error('OpenRouter API key not configured. Please set EXPO_PUBLIC_OPENROUTER_API_KEY in your environment variables.');
    }

    try {
      const requestBody: any = {
        model: model,
        messages: messages,
        temperature: 0.1,
        max_tokens: 1500,
      };

      // Enable reasoning for Grok models
      if (model.includes('grok')) {
        requestBody.reasoning = { enabled: true };
      }

      const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Referer': 'https://github.com/your-repo/finance-app',
          'X-Title': 'Finance App AI Assistant',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OpenRouter API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      // Return the full message object to preserve reasoning_details
      return data.choices[0]?.message || {};
    } catch (error) {
      console.error('OpenRouter reasoning conversation failed:', error);
      throw error;
    }
  }

  /**
   * Enhanced analysis with reasoning preservation for complex queries
   */
  async analyzeWithReasoning(prompt: string, followUpQuestions: string[] = []): Promise<any> {
    if (!OPENROUTER_API_KEY) {
      throw new Error('OpenRouter API key not configured. Please set EXPO_PUBLIC_OPENROUTER_API_KEY in your environment variables.');
    }

    try {
      // Initial analysis with reasoning
      const initialResponse = await this.makeOpenRouterRequest([
        { role: "user", content: prompt }
      ]);

      let messages = [
        { role: 'user', content: prompt },
        {
          role: 'assistant',
          content: initialResponse.content,
          reasoning_details: initialResponse.reasoning_details, // Preserve reasoning
        },
      ];

      // Handle follow-up questions while preserving reasoning context
      for (const followUp of followUpQuestions) {
        const followUpResponse = await this.continueReasoningConversation([
          ...messages,
          { role: 'user', content: followUp },
        ]);

        messages.push(
          { role: 'user', content: followUp },
          {
            role: 'assistant',
            content: followUpResponse.content,
            reasoning_details: followUpResponse.reasoning_details,
          }
        );
      }

      // Return the final response with full reasoning context
      return {
        finalAnswer: messages[messages.length - 1].content,
        reasoningChain: messages.filter(m => m.role === 'assistant'),
        fullConversation: messages,
      };
    } catch (error) {
      console.error('Reasoning analysis failed:', error);
      throw error;
    }
  }

  // Helper methods
  private parseAIResponse(response: string): any {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return {};
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      return {};
    }
  }

  private parseLogAnalysisResponse(response: string): LogAnalysis[] {
    try {
      const parsed = JSON.parse(response);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('Failed to parse log analysis response:', error);
      return [];
    }
  }

  private parseEmotionalResponse(response: string): any {
    try {
      return JSON.parse(response);
    } catch (error) {
      return {
        emotionalState: 'neutral',
        analysis: 'Analysis completed but response format unclear.',
        suggestions: ['Continue tracking expenses for better insights'],
      };
    }
  }

  private parseSummaryResponse(response: string): any {
    try {
      return JSON.parse(response);
    } catch (error) {
      return {
        summary: 'Summary generated but format unclear.',
        keyInsights: ['Unable to parse detailed insights'],
        trends: 'Trend analysis unavailable.',
      };
    }
  }

  private analyzeSpendingPatterns(expenses: any[]): string {
    const total = expenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
    const average = expenses.length > 0 ? total / expenses.length : 0;
    const categories: { [key: string]: number } = {};

    expenses.forEach(exp => {
      const cat = exp.category || 'Other';
      categories[cat] = (categories[cat] || 0) + (Number(exp.amount) || 0);
    });

    return `Total expenses: ${expenses.length}, Total amount: ₹${total.toFixed(2)}, Average: ₹${average.toFixed(2)}
Category breakdown: ${Object.entries(categories).map(([cat, amt]: [string, number]) => `${cat}: ₹${amt.toFixed(2)}`).join(', ')}`;
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

  private getFallbackInsights(expenses: any[], budgets: any = {}): SpendingAnalysis {
    const totalSpending = expenses.reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0);
    const categoryCount = new Set(expenses.map(e => e.category)).size;

    const fallbackInsights: FinancialInsight[] = [
      {
        id: 'fallback_1',
        title: 'Spending Overview',
        description: `You've spent ₹${totalSpending.toFixed(2)} across ${categoryCount} categories.`,
        type: 'tip',
        icon: '💰',
        severity: 'Low',
      },
      {
        id: 'fallback_2',
        title: 'Track Your Expenses',
        description: 'Continue tracking your expenses to identify spending patterns and opportunities for savings.',
        type: 'tip',
        icon: '📊',
        severity: 'Low',
      },
    ];

    // Add budget-related insight if budgets exist
    if (Object.keys(budgets).length > 0) {
      const budgetCategories = Object.keys(budgets);
      fallbackInsights.push({
        id: 'fallback_3',
        title: 'Budget Tracking',
        description: `You've set budgets for ${budgetCategories.length} categories. Keep monitoring your spending against these limits.`,
        type: 'warning',
        icon: '🎯',
        severity: 'Medium',
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

export const openRouterAIService = new OpenRouterAIService();
export default openRouterAIService;