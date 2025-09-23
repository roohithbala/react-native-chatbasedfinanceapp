import { create } from 'zustand';
import SplitBillService from '../services/splitBillService';
import type { 
  SplitBill,
  CreateSplitBillParams, 
  GetSplitBillsParams,
  SplitBillsResponse,
  SplitBillStats 
} from '../services/splitBillService';interface SplitBillsState {
  splitBills: SplitBill[];
  isLoading: boolean;
  error: string | null;

  // Actions
  createSplitBill: (data: CreateSplitBillParams) => Promise<SplitBill>;
  getSplitBills: (params?: GetSplitBillsParams) => Promise<SplitBillsResponse>;
  getGroupSplitBills: (groupId: string, page?: number, limit?: number) => Promise<SplitBillsResponse>;
  getSplitBill: (id: string) => Promise<SplitBill>;
  markSplitBillAsPaid: (id: string) => Promise<SplitBill>;
  getSplitBillStats: (groupId?: string, period?: 'week' | 'month' | 'year') => Promise<SplitBillStats>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useSplitBillsStore = create<SplitBillsState>((set, get) => ({
  splitBills: [],
  isLoading: false,
  error: null,

  createSplitBill: async (data: CreateSplitBillParams): Promise<SplitBill> => {
    try {
      console.log('Store createSplitBill called with data:', data);
      set({ isLoading: true, error: null });
      const response = await SplitBillService.createSplitBill(data);
      console.log('SplitBillService response:', response);

      if (!response.splitBill) {
        throw new Error('Invalid response from server');
      }

      set((state) => ({
        splitBills: [...(state.splitBills || []), response.splitBill],
        isLoading: false
      }));

      return response.splitBill;
    } catch (error: any) {
      console.log('Store createSplitBill error:', error);
      set({
        error: error.response?.data?.message || error.message || 'Failed to create split bill',
        isLoading: false
      });
      throw error;
    }
  },

  getSplitBills: async (params: GetSplitBillsParams = {}): Promise<SplitBillsResponse> => {
    try {
      set({ isLoading: true, error: null });
      const response = await SplitBillService.getSplitBills(params);

      if (!response.splitBills) {
        throw new Error('Invalid response from server');
      }

      set((state) => ({
        splitBills: Array.isArray(response.splitBills) ? response.splitBills : [],
        isLoading: false
      }));

      return response;
    } catch (error: any) {
      set({
        error: error.response?.data?.message || error.message || 'Failed to get split bills',
        splitBills: [],
        isLoading: false
      });
      throw error;
    }
  },

  getGroupSplitBills: async (groupId: string, page = 1, limit = 20): Promise<SplitBillsResponse> => {
    try {
      set({ isLoading: true, error: null });
      const response = await SplitBillService.getGroupSplitBills(groupId, page, limit);

      if (!response || !response.splitBills) {
        console.error('Invalid response structure from SplitBillService:', response);
        throw new Error('Invalid response from server');
      }

      set((state) => ({
        splitBills: response.splitBills,
        isLoading: false
      }));

      return response;
    } catch (error: any) {
      console.error('Error in getGroupSplitBills:', error);

      if (error.response?.status === 403) {
        console.log('Group split bills access restricted - user may not have permission');
        set({
          splitBills: [],
          isLoading: false
        });
        return { splitBills: [], totalPages: 0, currentPage: 1, total: 0 };
      }

      set({
        error: error.response?.data?.message || error.message || 'Failed to get group split bills',
        splitBills: [],
        isLoading: false
      });
      throw error;
    }
  },

  getSplitBill: async (id: string): Promise<SplitBill> => {
    try {
      set({ isLoading: true, error: null });
      const response = await SplitBillService.getSplitBill(id);

      if (!response.splitBill) {
        throw new Error('Invalid response from server');
      }

      return response.splitBill;
    } catch (error: any) {
      set({
        error: error.response?.data?.message || error.message || 'Failed to get split bill',
        isLoading: false
      });
      throw error;
    }
  },

  markSplitBillAsPaid: async (id: string): Promise<SplitBill> => {
    try {
      set({ isLoading: true, error: null });
      const response = await SplitBillService.markAsPaid(id);

      if (!response.splitBill) {
        throw new Error('Invalid response from server');
      }

      set((state) => ({
        splitBills: Array.isArray(state.splitBills) ? state.splitBills.map(bill =>
          bill._id === id ? response.splitBill : bill
        ) : [],
        isLoading: false
      }));

      return response.splitBill;
    } catch (error: any) {
      set({
        error: error.response?.data?.message || error.message || 'Failed to mark split bill as paid',
        isLoading: false
      });
      throw error;
    }
  },

  getSplitBillStats: async (groupId?: string, period: 'week' | 'month' | 'year' = 'month'): Promise<SplitBillStats> => {
    try {
      set({ isLoading: true, error: null });
      const stats = await SplitBillService.getStats(groupId, period);
      set({ isLoading: false });
      return stats;
    } catch (error: any) {
      set({
        error: error.response?.data?.message || error.message || 'Failed to get split bill stats',
        isLoading: false
      });
      throw error;
    }
  },

  setLoading: (loading: boolean) => set({ isLoading: loading }),
  setError: (error: string | null) => set({ error }),
  clearError: () => set({ error: null }),
}));