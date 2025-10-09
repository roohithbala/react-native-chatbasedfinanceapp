import { FinancialInsight, SpendingAnalysis } from './types';

export class ResponseParser {
  static parseSpendingAnalysisResponse(response: string): SpendingAnalysis {
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
      throw new Error('Invalid AI response format');
    }
  }
}