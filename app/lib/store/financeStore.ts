import { create } from 'zustand';

interface User {
  _id: string;
  name: string;
  username: string;
  email?: string;
  avatar?: string;
}

interface Expense {
  _id: string;
  description: string;
  amount: number;
  category: string;
  createdBy: User;
  participants: User[];
  createdAt: string;
  updatedAt: string;
}

interface SplitBillParticipant {
  userId: string;
  amount: number;
  isPaid: boolean;
  isRejected?: boolean;
  paidAt?: string;
}

interface SplitBill {
  _id: string;
  description: string;
  totalAmount: number;
  participants: SplitBillParticipant[];
  createdBy: User;
  groupId?: string;
  category: string;
  currency: string;
  isSettled: boolean;
  createdAt: string;
  updatedAt: string;
}

interface FinanceState {
  currentUser: User | null;
  expenses: Expense[];
  splitBills: SplitBill[];
  isLoading: boolean;
  error: string | null;

  // Actions
  setCurrentUser: (user: User) => void;
  createSplitBill: (splitBillData: any) => Promise<SplitBill>;
  markSplitBillAsPaid: (splitBillId: string) => Promise<void>;
  rejectSplitBill: (splitBillId: string) => Promise<void>;
  loadExpenses: () => Promise<void>;
  loadSplitBills: () => Promise<void>;
  refreshData: () => Promise<void>;
}

const API_BASE_URL = 'http://10.131.135.172:3001/api';

class FinanceAPI {
  private getAuthHeaders() {
    // For React Native, we'll need to get the token from AsyncStorage
    // For now, return basic headers
    return {
      'Content-Type': 'application/json',
      // 'Authorization': token ? `Bearer ${token}` : '',
    };
  }

  async createSplitBill(splitBillData: any): Promise<SplitBill> {
    const response = await fetch(`${API_BASE_URL}/split-bills`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(splitBillData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create split bill');
    }

    return response.json();
  }

  async markSplitBillAsPaid(splitBillId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/split-bills/${splitBillId}/mark-paid`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to mark payment as paid');
    }
  }

  async rejectSplitBill(splitBillId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/split-bills/${splitBillId}/reject`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to reject split bill');
    }
  }

  async getExpenses(): Promise<Expense[]> {
    const response = await fetch(`${API_BASE_URL}/expenses`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to load expenses');
    }

    const data = await response.json();
    return data.expenses || [];
  }

  async getSplitBills(): Promise<SplitBill[]> {
    const response = await fetch(`${API_BASE_URL}/split-bills`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to load split bills');
    }

    const data = await response.json();
    return data.splitBills || [];
  }
}

const financeAPI = new FinanceAPI();

export const useFinanceStore = create<FinanceState>((set, get) => ({
  currentUser: null,
  expenses: [],
  splitBills: [],
  isLoading: false,
  error: null,

  setCurrentUser: (user: User) => {
    set({ currentUser: user });
  },

  createSplitBill: async (splitBillData: any) => {
    set({ isLoading: true, error: null });
    try {
      const newSplitBill = await financeAPI.createSplitBill(splitBillData);

      // Add to local state
      set(state => ({
        splitBills: [newSplitBill, ...state.splitBills],
        isLoading: false
      }));

      return newSplitBill;
    } catch (error: any) {
      set({
        error: error.message || 'Failed to create split bill',
        isLoading: false
      });
      throw error;
    }
  },

  markSplitBillAsPaid: async (splitBillId: string) => {
    set({ isLoading: true, error: null });
    try {
      await financeAPI.markSplitBillAsPaid(splitBillId);

      // Update local state
      set(state => ({
        splitBills: state.splitBills.map(bill =>
          bill._id === splitBillId
            ? {
                ...bill,
                participants: bill.participants.map(p =>
                  p.userId === state.currentUser?._id
                    ? { ...p, isPaid: true, paidAt: new Date().toISOString() }
                    : p
                )
              }
            : bill
        ),
        isLoading: false
      }));
    } catch (error: any) {
      set({
        error: error.message || 'Failed to mark payment as paid',
        isLoading: false
      });
      throw error;
    }
  },

  rejectSplitBill: async (splitBillId: string) => {
    set({ isLoading: true, error: null });
    try {
      await financeAPI.rejectSplitBill(splitBillId);

      // Update local state
      set(state => ({
        splitBills: state.splitBills.map(bill =>
          bill._id === splitBillId
            ? {
                ...bill,
                participants: bill.participants.map(p =>
                  p.userId === state.currentUser?._id
                    ? { ...p, isRejected: true }
                    : p
                )
              }
            : bill
        ),
        isLoading: false
      }));
    } catch (error: any) {
      set({
        error: error.message || 'Failed to reject split bill',
        isLoading: false
      });
      throw error;
    }
  },

  loadExpenses: async () => {
    set({ isLoading: true, error: null });
    try {
      const expenses = await financeAPI.getExpenses();
      set({ expenses, isLoading: false });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to load expenses',
        isLoading: false
      });
    }
  },

  loadSplitBills: async () => {
    set({ isLoading: true, error: null });
    try {
      const splitBills = await financeAPI.getSplitBills();
      set({ splitBills, isLoading: false });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to load split bills',
        isLoading: false
      });
    }
  },

  refreshData: async () => {
    await Promise.all([
      get().loadExpenses(),
      get().loadSplitBills()
    ]);
  }
}));