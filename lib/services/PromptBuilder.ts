export class PromptBuilder {
  static buildSpendingAnalysisPrompt(
    expenseSummary: Record<string, { total: number; count: number; items: any[] }>,
    totalSpending: number,
    categories: string[],
    budgets: any = {}
  ): string {
    return `
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
  }

  static buildSystemMessage(): { role: string; content: string } {
    return {
      role: 'system',
      content: 'You are a helpful financial advisor providing insights on spending patterns. Always respond with valid JSON.'
    };
  }

  static buildUserMessage(prompt: string): { role: string; content: string } {
    return {
      role: 'user',
      content: prompt
    };
  }
}