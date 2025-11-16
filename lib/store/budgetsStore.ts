import { create } from 'zustand';
import { Alert } from 'react-native';
import { budgetsAPI } from '../services/api';
import type { Budget } from './types';

interface BudgetsState {
  budgets: Budget;
  detailedBudgets: any;
  historicalBudgets: any;
  budgetTrends: any;
  selectedPeriod: 'monthly' | 'yearly';
  selectedYear: number;
  selectedMonth: number;
  isLoading: boolean;
  error: string | null;

  // Actions
  setBudget: (category: string, amount: number) => Promise<void>;
  loadBudgets: () => Promise<void>;
  loadHistoricalBudgets: (params?: { period?: string; year?: number; month?: number }) => Promise<void>;
  loadBudgetTrends: (months?: number) => Promise<void>;
  rolloverBudgets: (params?: { rolloverUnused?: boolean; rolloverPercentage?: number }) => Promise<void>;
  resetBudgets: (params?: { period?: string; resetAmount?: number }) => Promise<void>;
  setSelectedPeriod: (period: 'monthly' | 'yearly') => void;
  setSelectedYear: (year: number) => void;
  setSelectedMonth: (month: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useBudgetsStore = create<BudgetsState>((set, get) => ({
  budgets: {},
  detailedBudgets: {},
  historicalBudgets: {},
  budgetTrends: {},
  selectedPeriod: 'monthly',
  selectedYear: new Date().getFullYear(),
  selectedMonth: new Date().getMonth() + 1,
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
        const detailedBudgets = response.detailedBudgets || {};
        set({
          budgets: budgets,
          detailedBudgets: detailedBudgets,
          error: null,
          isLoading: false
        });
      } else {
        set({
          budgets: {},
          detailedBudgets: {},
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

  loadHistoricalBudgets: async ({ period, year, month } = {}) => {
    try {
      set({ isLoading: true, error: null });
      const response = await budgetsAPI.getHistoricalBudgets({ period, year, month });
      // Normalize multiple possible response shapes from backend
      const resp = response || {};
      let budgetsData: any = {};

      if (resp.budgets && typeof resp.budgets === 'object') {
        budgetsData = resp.budgets;
      } else if (resp.data && resp.data.budgets) {
        budgetsData = resp.data.budgets;
      } else if (resp.historicalBudgets && typeof resp.historicalBudgets === 'object') {
        budgetsData = resp.historicalBudgets;
      } else if (resp.periods && typeof resp.periods === 'object') {
        budgetsData = resp.periods;
      } else if (typeof resp === 'object' && Object.keys(resp).length > 0) {
        // Heuristic: if the object looks like a mapping of periodKey -> periodData
        const sampleVal: any = Object.values(resp)[0] as any;
        if (sampleVal && (sampleVal.totals || sampleVal.detailedBudgets || sampleVal.budgets)) {
          budgetsData = resp as any;
        }
      }

      // Normalize period keys to consistent `YYYY` or `YYYY-MM` format
      const normalizeKey = (rawKey: string) => {
        if (!rawKey || typeof rawKey !== 'string') return rawKey;
        // If already in YYYY or YYYY-MM format, return as-is (basic check)
        if (/^\d{4}$/.test(rawKey)) return rawKey;
        if (/^\d{4}-\d{2}$/.test(rawKey)) return rawKey;

        // Attempt to extract first 4-digit year and last 1-2 digit month
        const yearMatch = rawKey.match(/(\d{4})/);
        const monthMatch = rawKey.match(/(\d{1,2})$/);
        if (yearMatch) {
          const y = yearMatch[1];
          if (monthMatch) {
            const m = parseInt(monthMatch[1], 10);
            if (m >= 1 && m <= 12) return `${y}-${m.toString().padStart(2, '0')}`;
          }
          return y;
        }

        // Fallback: return rawKey unchanged
        return rawKey;
      };

      const normalized: any = {};
      Object.keys(budgetsData || {}).forEach((k) => {
        const nk = normalizeKey(k);
        if (nk in normalized) {
          // Merge period objects if duplicate normalized key appears
          normalized[nk] = { ...normalized[nk], ...(budgetsData[k] || {}) };
          console.log(`⚙️ Merging historical period key ${k} -> ${nk}`);
        } else {
          if (nk !== k) console.log(`⚙️ Normalized historical key ${k} -> ${nk}`);
          normalized[nk] = budgetsData[k];
        }
      });

      // Attach raw expenses returned by the historical endpoint (if any)
      // The API may include an `expenses` array and `expensesByCategory` map under the response
      const respExpenses = (resp && (resp.expenses || resp.data?.expenses)) || [];
      const respExpensesByCategory = (resp && (resp.expensesByCategory || resp.data?.expensesByCategory)) || {};

      // Determine requested period key from the params passed to this action
      const reqPeriod = (period || 'monthly');
      const reqYear = (year !== undefined && year !== null) ? year : undefined;
      const reqMonth = (month !== undefined && month !== null) ? month : undefined;
      let requestedKey: string | null = null;
      try {
        if (reqPeriod === 'yearly' && reqYear) requestedKey = String(reqYear);
        else if (reqYear && reqMonth) requestedKey = `${reqYear}-${String(reqMonth).padStart(2, '0')}`;
      } catch (e) {
        requestedKey = null;
      }

      if (requestedKey) {
        if (!normalized[requestedKey]) {
          // Create an empty period entry and attach expenses
          normalized[requestedKey] = normalized[requestedKey] || {};
          normalized[requestedKey].budgets = normalized[requestedKey].budgets || {};
          normalized[requestedKey].totals = normalized[requestedKey].totals || { totalAmount: 0, totalSpent: 0 };
          normalized[requestedKey].detailedBudgets = normalized[requestedKey].detailedBudgets || [];
        }
        if (Array.isArray(respExpenses) && respExpenses.length > 0) {
          normalized[requestedKey].expenses = respExpenses;
          console.log(`📥 Attached ${respExpenses.length} historical expenses to period ${requestedKey}`);
        }
        if (respExpensesByCategory && Object.keys(respExpensesByCategory).length > 0) {
          normalized[requestedKey].expensesByCategory = respExpensesByCategory;
          console.log(`📥 Attached expensesByCategory for period ${requestedKey}`);
        }
      }

      // Merge into existing historicalBudgets so multiple periods can be cached
      const current = get().historicalBudgets || {};
      const merged = { ...current, ...(normalized || {}) };

      if (merged && typeof merged === 'object') {
        set({
          historicalBudgets: merged,
          error: null,
          isLoading: false
        });
      } else {
        set({
          historicalBudgets: {},
          error: null,
          isLoading: false
        });
      }
    } catch (error: any) {
      console.error('Error loading historical budgets:', error);
      set({
        error: 'Failed to load historical budgets',
        historicalBudgets: {},
        isLoading: false
      });
    }
  },

  loadBudgetTrends: async (months: number = 6) => {
    try {
      set({ isLoading: true, error: null });
      console.log('📊 Loading budget trends for last', months, 'months');
      const response = await budgetsAPI.getBudgetTrends({ months });

      console.log('📊 Budget trends API response:', {
        hasResponse: !!response,
        hasTrends: !!response?.trends,
        trendsType: typeof response?.trends,
        trendsKeys: response?.trends ? Object.keys(response.trends) : [],
        sample: response?.trends ? JSON.stringify(response.trends).substring(0, 200) : 'none'
      });

      // The API returns { trends: {...} }, so we need to extract trends
      const budgetTrends = response?.trends || response || {};
      
      if (budgetTrends && typeof budgetTrends === 'object') {
        console.log('✅ Budget trends loaded successfully:', {
          hasOverallMetrics: !!budgetTrends.overallMetrics,
          hasMonthlyTrends: !!budgetTrends.monthlyTrends,
          monthlyTrendsCount: budgetTrends.monthlyTrends?.length || 0,
          hasCategoryTrends: !!budgetTrends.categoryTrends,
          categoryCount: budgetTrends.categoryTrends ? Object.keys(budgetTrends.categoryTrends).length : 0
        });
        
        set({
          budgetTrends: budgetTrends,
          error: null,
          isLoading: false
        });
      } else {
        console.warn('⚠️ No budget trends data received');
        set({
          budgetTrends: {},
          error: null,
          isLoading: false
        });
      }
    } catch (error: any) {
      console.error('❌ Error loading budget trends:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      set({
        error: 'Failed to load budget trends',
        budgetTrends: {},
        isLoading: false
      });
    }
  },

  rolloverBudgets: async ({ rolloverUnused, rolloverPercentage } = {}) => {
    try {
      set({ isLoading: true, error: null });
      const response = await budgetsAPI.rolloverBudgets({ rolloverUnused, rolloverPercentage });

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
        error: error.response?.data?.message || error.message || 'Failed to rollover budgets',
        isLoading: false
      });
      throw error;
    }
  },

  resetBudgets: async ({ period, resetAmount } = {}) => {
    try {
      set({ isLoading: true, error: null });
      const response = await budgetsAPI.resetBudgets({ period, resetAmount });

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
        error: error.response?.data?.message || error.message || 'Failed to reset budgets',
        isLoading: false
      });
      throw error;
    }
  },

  setSelectedPeriod: (period: 'monthly' | 'yearly') => set({ selectedPeriod: period }),
  setSelectedYear: (year: number) => set({ selectedYear: year }),
  setSelectedMonth: (month: number) => set({ selectedMonth: month }),
  setLoading: (loading: boolean) => set({ isLoading: loading }),
  setError: (error: string | null) => set({ error }),
  clearError: () => set({ error: null }),
}));

export default useBudgetsStore;