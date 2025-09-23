import { create } from 'zustand';
import { Alert } from 'react-native';
import { budgetsAPI } from '../services/api';
import type { Budget } from './types';

interface BudgetsState {
  budgets: Budget;
  isLoading: boolean;
  error: string | null;

  // Actions
  setBudget: (category: string, amount: number) => Promise<void>;
  loadBudgets: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useBudgetsStore = create<BudgetsState>((set, get) => ({
  budgets: {},
  isLoading: false,
  error: null,

  setBudget: async (category: string, amount: number) => {
    try {
      set({ isLoading: true, error: null });
      const response = await budgetsAPI.setBudget({ category, amount });

      if (response && response.budgets) {
        const budgets = typeof response.budgets === 'object' && !Array.isArray(response.budgets)
          ? response.budgets
          : {};
        set({
          budgets: budgets,
          error: null,
          isLoading: false
        });
      } else {
        await get().loadBudgets();
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || error.message || 'Failed to set budget',
        isLoading: false
      });
      throw error;
    }
  },

  loadBudgets: async () => {
    try {
      set({ isLoading: true, error: null });
      const response = await budgetsAPI.getBudgets();

      if (response && response.budgets) {
        const budgets = typeof response.budgets === 'object' && !Array.isArray(response.budgets)
          ? response.budgets
          : {};
        set({
          budgets: budgets,
          error: null,
          isLoading: false
        });
      } else {
        set({
          budgets: {},
          error: null,
          isLoading: false
        });
      }
    } catch (error: any) {
      console.error('Error loading budgets:', error);

      let errorMessage = 'Failed to load budgets';

      if (error.message === 'Network Error') {
        errorMessage = 'Network error: Please check your internet connection and try again';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      set({
        error: errorMessage,
        budgets: {},
        isLoading: false
      });

      Alert.alert('Error', errorMessage);
    }
  },

  setLoading: (loading: boolean) => set({ isLoading: loading }),
  setError: (error: string | null) => set({ error }),
  clearError: () => set({ error: null }),
}));