import { OpenAIClient } from './OpenAIClient';

export class EmotionalAnalysisService {
  private openAIClient: OpenAIClient;

  constructor() {
    this.openAIClient = OpenAIClient.getInstance();
  }

  async analyzeEmotions(expenses: any[]): Promise<any> {
    try {
      if (!this.openAIClient.isConfigured()) {
        return this.getFallbackAnalysis();
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
        return this.getFallbackAnalysis();
      }
    } catch (error) {
      console.error('Emotional analysis failed:', error);
      return this.getFallbackAnalysis();
    }
  }

  private getFallbackAnalysis(): any {
    return {
      emotionalState: 'neutral',
      analysis: 'Unable to analyze emotional spending patterns at this time.',
      suggestions: ['Continue tracking expenses for better insights.'],
    };
  }
}