import { useState, useEffect } from 'react';
import { useFinanceStore } from '@/lib/store/financeStore';
import { aiAPI } from '@/lib/services/api';

export const useInsightsData = () => {
  const {
    currentUser,
    expenses,
    budgets,
    groups,
    isLoading: storeLoading,
    error: storeError,
    loadExpenses,
    loadBudgets,
    loadGroups,
  } = useFinanceStore();

  const [aiInsights, setAiInsights] = useState<any[]>([]);
  const [isLoadingAI, setIsLoadingAI] = useState(false);

  // Load data on mount
  useEffect(() => {
    if (currentUser) {
      loadExpenses();
      loadBudgets();
      loadGroups();
    }
  }, [currentUser, loadExpenses, loadBudgets, loadGroups]);

  const loadAIInsights = async () => {
    if (!currentUser) return;

    try {
      setIsLoadingAI(true);
      // Try to get real AI insights from backend
      try {
        const predictions = await aiAPI.getPredictions();
        const emotionalAnalysis = await aiAPI.getEmotionalAnalysis();
        const summary = await aiAPI.getSummary();

        // Combine and format the insights
        const realInsights = [
          ...(predictions?.data ? [{
            id: 'predictions',
            title: 'Spending Predictions',
            description: predictions.data.message || 'AI predictions loaded',
            type: 'prediction',
            icon: '🔮'
          }] : []),
          ...(emotionalAnalysis?.data ? [{
            id: 'emotional',
            title: 'Emotional Analysis',
            description: emotionalAnalysis.data.message || 'Emotional insights loaded',
            type: 'tip',
            icon: '💡'
          }] : []),
          ...(summary?.data ? [{
            id: 'summary',
            title: 'Spending Summary',
            description: summary.data.message || 'Monthly summary loaded',
            type: 'success',
            icon: '📊'
          }] : [])
        ];

        if (realInsights.length > 0) {
          setAiInsights(realInsights);
          return;
        }
      } catch (apiError) {
        console.log('AI API not available, using mock insights:', apiError);
      }

      // Fallback to mock insights if API fails
      const mockInsights = [
        {
          id: '1',
          type: 'spending_pattern',
          title: 'Spending Pattern Detected',
          description: 'You spend 40% more on weekends compared to weekdays',
          severity: 'medium',
          category: 'behavior'
        },
        {
          id: '2',
          type: 'budget_alert',
          title: 'Budget Alert',
          description: 'You\'ve exceeded your Food budget by 15%',
          severity: 'high',
          category: 'budget'
        }
      ];
      setAiInsights(mockInsights);
    } catch (error) {
      console.error('Error loading AI insights:', error);
    } finally {
      setIsLoadingAI(false);
    }
  };

  return {
    expenses,
    budgets,
    groups,
    isLoading: storeLoading || isLoadingAI,
    aiInsights,
    loadAIInsights,
  };
};

export default useInsightsData;