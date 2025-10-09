import { OpenAIClient } from './OpenAIClient';
import { FinancialInsight, SpendingAnalysis } from './types';
import { SpendingDataProcessor } from './SpendingDataProcessor';
import { PromptBuilder } from './PromptBuilder';
import { FallbackInsightsGenerator } from './FallbackInsightsGenerator';
import { ResponseParser } from './ResponseParser';

export class AIAnalysisEngine {
  private openAIClient: OpenAIClient;

  constructor() {
    this.openAIClient = OpenAIClient.getInstance();
  }

  async analyzeSpending(expenses: any[], budgets: any = {}): Promise<SpendingAnalysis> {
    try {
      if (!this.openAIClient.isConfigured()) {
        return FallbackInsightsGenerator.generateInsights(expenses, budgets);
      }

      // Prepare expense data for analysis
      const expenseSummary = SpendingDataProcessor.processExpenses(expenses);
      const totalSpending = SpendingDataProcessor.calculateTotalSpending(expenseSummary);
      const categories = SpendingDataProcessor.getCategories(expenseSummary);

      const prompt = PromptBuilder.buildSpendingAnalysisPrompt(expenseSummary, totalSpending, categories, budgets);

      const messages = [
        PromptBuilder.buildSystemMessage(),
        PromptBuilder.buildUserMessage(prompt)
      ];

      const response = await this.openAIClient.makeRequest(messages);

      try {
        return ResponseParser.parseSpendingAnalysisResponse(response);
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError);
        // Return fallback insights if parsing fails
        return FallbackInsightsGenerator.generateInsights(expenses, budgets);
      }
    } catch (error) {
      console.error('AI analysis failed:', error);
      return FallbackInsightsGenerator.generateInsights(expenses, budgets);
    }
  }
}