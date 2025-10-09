import { OpenAIClient } from './OpenAIClient';

export class CustomInsightsService {
  private openAIClient: OpenAIClient;

  constructor() {
    this.openAIClient = OpenAIClient.getInstance();
  }

  async generateInsights(expenses: any[], focusArea: string): Promise<any> {
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