import { create } from 'zustand';
import freeAIService, { SpendingAnalysis } from '@/lib/services/freeAIService';
import { useExpensesStore } from './expensesStore';
import { useBudgetsStore } from './budgetsStore';

interface AIState {
  predictions: any[];
  insights: any[];
  isLoading: boolean;
  error: string | null;

  // Actions
  loadPredictions: () => Promise<void>;
  loadInsights: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useAIStore = create<AIState>((set, get) => ({
  predictions: [],
  insights: [],
  isLoading: false,
  error: null,

  loadPredictions: async () => {
    try {
      set({ isLoading: true, error: null });

      const expenses = useExpensesStore.getState().expenses;
      const budgets = useBudgetsStore.getState().budgets;

      const analysis: SpendingAnalysis = await freeAIService.analyzeSpending(expenses, budgets);

      set({
        predictions: analysis.predictions || [],
        insights: analysis.insights || [],
        isLoading: false
      });
    } catch (error: any) {
      console.error('Error loading predictions:', error);
      set({
        error: error.message || 'Failed to load predictions',
        predictions: [],
        isLoading: false
      });
      throw error;
    }
  },

  loadInsights: async () => {
    try {
      set({ isLoading: true, error: null });

      const expenses = useExpensesStore.getState().expenses;
      const budgets = useBudgetsStore.getState().budgets;

      const analysis: SpendingAnalysis = await freeAIService.analyzeSpending(expenses, budgets);

      set({
        insights: analysis.insights || [],
        predictions: analysis.predictions || [],
        isLoading: false
      });
    } catch (error: any) {
      console.error('Error loading insights:', error);
      set({
        error: error.message || 'Failed to load insights',
        insights: [],
        isLoading: false
      });
      throw error;
    }
  },

  setLoading: (loading: boolean) => set({ isLoading: loading }),
  setError: (error: string | null) => set({ error }),
  clearError: () => set({ error: null }),
}));