import { useState, useEffect } from 'react';
import { useFinanceStore } from '../lib/store/financeStore';

export const useInsightsData = () => {
  const {
    expenses,
    budgets,
    loadExpenses,
    loadBudgets,
    currentUser,
    loadPredictions,
    loadInsights,
    predictions,
    insights,
    groups
  } = useFinanceStore();

  const [isLoading, setIsLoading] = useState(false);
  const [aiInsights, setAiInsights] = useState<any>(null);
  const [aiPredictions, setAiPredictions] = useState<any>(null);
  const [fallbackInsights, setFallbackInsights] = useState<any[]>([]);

  // Load data when component mounts
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      console.log('Loading insights data...');
      setIsLoading(true);
      await Promise.all([
        loadExpenses(),
        loadBudgets(),
        loadAIInsights()
      ]);
      console.log('Insights data loaded successfully');
    } catch (error) {
      console.error('Error loading insights data:', error);
      // Error is already handled in the store, just log here
      // Alert is handled in the store's loadExpenses function
    } finally {
      setIsLoading(false);
    }
  };

  const loadAIInsights = async () => {
    try {
      const [summaryData, predictionsData] = await Promise.all([
        loadInsights(),
        loadPredictions()
      ]);

      // The free AI service returns insights and predictions directly
      // No need for complex response format handling
      setAiInsights(Array.isArray(summaryData) ? summaryData : []);
      setAiPredictions(Array.isArray(predictionsData) ? predictionsData : []);
    } catch (error) {
      console.error('Error loading AI data:', error);
      // Use fallback data if AI fails
      setAiInsights([]);
      setAiPredictions([]);
    }
  };

  return {
    expenses,
    budgets,
    currentUser,
    predictions,
    insights,
    groups,
    isLoading,
    aiInsights,
    aiPredictions,
    fallbackInsights,
    loadAIInsights,
  };
};