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

export interface EmotionalAnalysis {
  emotionalState: 'calm' | 'stressed' | 'impulsive' | 'satisfied' | 'neutral';
  analysis: string;
  suggestions: string[];
}

export interface FinancialSummary {
  summary: string;
  keyInsights: string[];
  trends: string;
}

export interface SpendingPrediction {
  predictions: Array<{
    month: string;
    predictedAmount: number;
    confidence: 'high' | 'medium' | 'low';
    reasoning: string;
  }>;
  overallTrend: 'increasing' | 'decreasing' | 'stable';
  recommendations: string[];
}

export interface SavingsAnalysis {
  savingsPotential: number;
  savingsCategories: Array<{
    category: string;
    currentSpending: number;
    potentialSavings: number;
    percentage: number;
    reasoning: string;
  }>;
  recommendations: string[];
  monthlySavingsGoal: number;
}