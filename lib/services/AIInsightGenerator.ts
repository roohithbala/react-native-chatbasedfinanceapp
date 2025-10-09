import { EmotionalAnalysisService } from './EmotionalAnalysisService';
import { FinancialSummaryService } from './FinancialSummaryService';
import { CustomInsightsService } from './CustomInsightsService';

export class AIInsightGenerator {
  private emotionalService: EmotionalAnalysisService;
  private summaryService: FinancialSummaryService;
  private customService: CustomInsightsService;

  constructor() {
    this.emotionalService = new EmotionalAnalysisService();
    this.summaryService = new FinancialSummaryService();
    this.customService = new CustomInsightsService();
  }

  async getEmotionalAnalysis(expenses: any[]): Promise<any> {
    return this.emotionalService.analyzeEmotions(expenses);
  }

  async getFinancialSummary(expenses: any[], period: string = 'month'): Promise<any> {
    return this.summaryService.generateSummary(expenses, period);
  }

  async generateCustomInsights(expenses: any[], focusArea: string): Promise<any> {
    return this.customService.generateInsights(expenses, focusArea);
  }
}