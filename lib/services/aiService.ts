interface SpendingPrediction {
  category: string;
  predictedOverage: number;
  confidence: number;
  suggestions: string[];
}

interface EmotionalSpendingAnalysis {
  dominantEmotion: string;
  spendingTriggers: string[];
  recommendations: string[];
}

export class AIService {
  static async predictSpending(expenses: any[], budgets: any): Promise<SpendingPrediction[]> {
    // Simulate AI prediction logic
    const predictions: SpendingPrediction[] = [];
    
    Object.keys(budgets).forEach(category => {
      const categoryExpenses = expenses.filter(e => e.category === category);
      const totalSpent = categoryExpenses.reduce((sum, e) => sum + e.amount, 0);
      const budget = budgets[category];
      
      // Simple trend analysis
      const recentExpenses = categoryExpenses.filter(e => 
        new Date(e.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      );
      const weeklySpent = recentExpenses.reduce((sum, e) => sum + e.amount, 0);
      const projectedMonthly = weeklySpent * 4.33; // Average weeks per month
      
      if (projectedMonthly > budget) {
        predictions.push({
          category,
          predictedOverage: projectedMonthly - budget,
          confidence: Math.random() * 0.3 + 0.7, // 70-100% confidence
          suggestions: this.generateSuggestions(category, projectedMonthly - budget),
        });
      }
    });
    
    return predictions;
  }

  static async analyzeEmotionalSpending(expenses: any[]): Promise<EmotionalSpendingAnalysis> {
    // Simulate emotional analysis
    const emotions = ['happy', 'stressed', 'bored', 'excited', 'anxious'];
    const dominantEmotion = emotions[Math.floor(Math.random() * emotions.length)];
    
    const triggers = {
      happy: ['celebration purchases', 'reward spending', 'impulse buys'],
      stressed: ['comfort shopping', 'convenience purchases', 'stress eating'],
      bored: ['entertainment expenses', 'online shopping', 'subscription services'],
      excited: ['hobby purchases', 'travel booking', 'tech gadgets'],
      anxious: ['security purchases', 'bulk buying', 'insurance upgrades'],
    };
    
    return {
      dominantEmotion,
      spendingTriggers: triggers[dominantEmotion as keyof typeof triggers] || [],
      recommendations: this.getEmotionalRecommendations(dominantEmotion),
    };
  }

  private static generateSuggestions(category: string, overage: number): string[] {
    const suggestions: Record<string, string[]> = {
      Food: [
        'Cook more meals at home',
        'Use grocery coupons and shop sales',
        'Reduce dining out frequency',
        'Try meal planning to reduce waste',
      ],
      Transport: [
        'Use public transportation more often',
        'Consider carpooling options',
        'Walk or bike for short distances',
        'Optimize your routes to save fuel',
      ],
      Entertainment: [
        'Look for free local events',
        'Use streaming services instead of movies',
        'Host potluck gatherings at home',
        'Take advantage of happy hour specials',
      ],
      Shopping: [
        'Create a shopping list and stick to it',
        'Wait 24 hours before non-essential purchases',
        'Compare prices across stores',
        'Buy generic brands when possible',
      ],
    };

    return suggestions[category] || ['Review your spending patterns', 'Set spending alerts'];
  }

  private static getEmotionalRecommendations(emotion: string): string[] {
    const recommendations: Record<string, string[]> = {
      happy: [
        'Set aside celebration money in your budget',
        'Practice mindful spending when excited',
        'Channel happiness into free activities',
      ],
      stressed: [
        'Identify stress spending triggers',
        'Find alternative stress relief activities',
        'Create a small emergency fund for stress periods',
      ],
      bored: [
        'Find free hobbies and activities',
        'Unsubscribe from promotional emails',
        'Set limits on entertainment spending',
      ],
      excited: [
        'Create a wishlist and wait before purchasing',
        'Research purchases thoroughly',
        'Set aside money for planned excitement purchases',
      ],
      anxious: [
        'Focus on essential purchases only',
        'Avoid bulk buying unless truly needed',
        'Consider the cost-benefit of security purchases',
      ],
    };

    return recommendations[emotion] || ['Practice mindful spending'];
  }

  static generateInsight(): string {
    const insights = [
      'Your coffee spending has increased 25% this month. Consider brewing at home.',
      'Great job staying under budget in Entertainment! Keep it up.',
      'You tend to overspend on weekends. Try setting a weekend budget.',
      'Your grocery spending is efficient compared to similar users.',
      'Consider automating savings to reach your financial goals faster.',
      'Peak spending hours are between 2-4 PM. Be extra mindful during this time.',
    ];

    return insights[Math.floor(Math.random() * insights.length)];
  }
}