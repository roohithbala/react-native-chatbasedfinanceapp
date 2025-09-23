import { create } from 'zustand';
import { Alert } from 'react-native';
import { expensesAPI } from '../services/api';
import type { Expense, CreateExpenseData } from './types';

interface ExpensesState {
  expenses: Expense[];
  isLoading: boolean;
  error: string | null;

  // Actions
  addExpense: (expense: CreateExpenseData) => Promise<void>;
  loadExpenses: () => Promise<void>;
  updateExpense: (id: string, updates: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useExpensesStore = create<ExpensesState>((set, get) => ({
  expenses: [],
  isLoading: false,
  error: null,

  addExpense: async (expenseData: CreateExpenseData) => {
    try {
      set({ isLoading: true, error: null });
      const response = await expensesAPI.addExpense(expenseData);

      const expense = response.data || response;
      if (!expense || !expense._id) {
        throw new Error('Invalid response from server');
      }

      set((state) => ({
        expenses: [...state.expenses, expense],
        isLoading: false
      }));
    } catch (error: any) {
      console.error('Add expense error:', error);
      set({
        error: error.response?.data?.message || error.message || 'Failed to add expense',
        isLoading: false
      });
      throw error;
    }
  },

  loadExpenses: async () => {
    try {
      console.log('Loading expenses from store...');
      set({ isLoading: true, error: null });
      const response = await expensesAPI.getExpenses();

      console.log('Expenses API response in store:', {
        hasExpenses: !!response?.expenses,
        expensesCount: response?.expenses?.length || 0,
        expensesType: Array.isArray(response?.expenses) ? 'array' : typeof response?.expenses,
        responseKeys: response ? Object.keys(response) : [],
        fullResponse: response
      });

      if (response?.rateLimited) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }

      if (response?.authError) {
        throw new Error('Authentication failed. Please log in again.');
      }

      if (response?.networkError) {
        throw new Error('Network error. Please check your internet connection.');
      }

      if (response?.serverError) {
        throw new Error(`Server error (${response.errorStatus}). Please try again later.`);
      }

      if (response?.unknownError) {
        throw new Error('An unexpected error occurred. Please try again.');
      }

      const expenses = Array.isArray(response?.expenses) ? response.expenses : [];

      console.log(`Setting ${expenses.length} expenses in store`);
      set({
        expenses: expenses,
        error: null,
        isLoading: false
      });

      console.log('Expenses loaded successfully');
    } catch (error: any) {
      console.error('Load expenses error in store:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        response: error.response?.data,
        status: error.response?.status,
        fullError: error
      });

      let errorMessage = 'Failed to load expenses';

      if (error.message === 'Network Error' || error.name === 'NetworkError' || !error.response) {
        errorMessage = 'Unable to connect to server. Please check your internet connection and ensure the server is running.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Authentication failed. Please log in again.';
        set({
          expenses: [],
        });
      } else if (error.response?.status === 404) {
        errorMessage = 'Expenses service not found. Please check server configuration.';
      } else if (error.response?.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message && error.message !== 'Invalid response from server') {
        errorMessage = error.message;
      } else {
        errorMessage = 'Unable to load expenses. Please try again later.';
      }

      console.log('Setting error state:', errorMessage);
      set({
        error: errorMessage,
        expenses: [],
        isLoading: false
      });

      Alert.alert('Error Loading Expenses', errorMessage);
    }
  },

  updateExpense: async (id: string, updates: any) => {
    try {
      set({ isLoading: true, error: null });
      const response = await expensesAPI.updateExpense(id, updates);
      set((state) => ({
        expenses: Array.isArray(state.expenses) ? state.expenses.map(exp =>
          exp._id === id ? response.data : exp
        ) : [],
        isLoading: false
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.message || error.message || 'Failed to update expense',
        isLoading: false
      });
      throw error;
    }
  },

  deleteExpense: async (id: string) => {
    try {
      set({ isLoading: true, error: null });
      await expensesAPI.deleteExpense(id);
      set((state) => ({
        expenses: Array.isArray(state.expenses) ? state.expenses.filter(exp => exp._id !== id) : [],
        isLoading: false
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.message || error.message || 'Failed to delete expense',
        isLoading: false
      });
      throw error;
    }
  },

  setLoading: (loading: boolean) => set({ isLoading: loading }),
  setError: (error: string | null) => set({ error }),
  clearError: () => set({ error: null }),
}));