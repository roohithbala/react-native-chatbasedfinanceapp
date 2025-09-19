import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { 
  authAPI, 
  expensesAPI, 
  groupsAPI, 
  chatAPI,
  budgetsAPI 
} from '@/app/services/api';
import type { Message } from '@/app/types/chat';
import type { 
  SplitBill,
  CreateSplitBillParams, 
  GetSplitBillsParams,
  SplitBillsResponse,
  SplitBillStats 
} from '@/app/services/splitBillService';
import SplitBillService from '@/app/services/splitBillService';
import freeAIService, { SpendingAnalysis } from '@/lib/services/freeAIService';

export type { SplitBill };

export interface User {
  _id: string;
  name: string;
  username: string;
  email: string;
  avatar: string;
  preferences?: {
    notifications: boolean;
    biometric: boolean;
    darkMode: boolean;
    currency: string;
  };
}

export interface Expense {
  _id: string;
  description: string;
  amount: number;
  category: string;
  userId: string;
  groupId?: string;
  createdAt: Date;
  tags?: string[];
  location?: string;
}

export interface CreateExpenseData {
  description: string;
  amount: number;
  category: string;
  userId: string;
  groupId?: string;
  tags?: string[];
  location?: string;
}

export interface SplitBillParticipant {
  userId: string;
  amount: number;
  percentage?: number;
  isPaid: boolean;
  paidAt?: Date;
}

export interface Budget {
  [category: string]: number;
}

export interface Group {
  _id: string;
  name: string;
  description?: string;
  avatar: string;
  inviteCode: string;
  members: {
    userId: string;
    role: 'admin' | 'member';
    user: User;
  }[];
  budgets: {
    category: string;
    amount: number;
    period: string;
  }[];
}

interface FinanceState {
  currentUser: User | null;
  isAuthenticated: boolean;
  authToken: string | null;
  expenses: Expense[];
  splitBills: SplitBill[];
  budgets: Budget;
  groups: Group[];
  selectedGroup: Group | null;
  messages: { [groupId: string]: Message[] };
  predictions: any[];
  insights: any[];
  isLoading: boolean;
  error: string | null;
  
  // Auth actions
  clearStorage: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: { name: string; email: string; username: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  loadStoredAuth: () => Promise<void>;
  updateProfile: (userData: User) => Promise<void>;
  
  // Expense actions
  addExpense: (expense: CreateExpenseData) => Promise<void>;
  loadExpenses: () => Promise<void>;
  updateExpense: (id: string, updates: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  
  // Split bill actions
  createSplitBill: (data: CreateSplitBillParams) => Promise<SplitBill>;
  getSplitBills: (params?: GetSplitBillsParams) => Promise<SplitBillsResponse>;
  getGroupSplitBills: (groupId: string, page?: number, limit?: number) => Promise<SplitBillsResponse>;
  getSplitBill: (id: string) => Promise<SplitBill>;
  markSplitBillAsPaid: (id: string) => Promise<SplitBill>;
  getSplitBillStats: (groupId?: string, period?: 'week' | 'month' | 'year') => Promise<SplitBillStats>;
  
  // Budget actions
  setBudget: (category: string, amount: number, groupId?: string) => Promise<void>;
  loadBudgets: (groupId?: string) => Promise<void>;
  
  // Group actions
  loadGroups: () => Promise<void>;
  createGroup: (groupData: any) => Promise<void>;
  joinGroupByCode: (inviteCode: string) => Promise<void>;
  selectGroup: (group: Group) => void;
  generateInviteLink: (groupId: string) => string;
  addMemberToGroup: (groupId: string, identifier: string, searchType?: 'email' | 'username') => Promise<void>;
  
  // Chat actions
  loadMessages: (groupId: string) => Promise<void>;
  sendMessage: (groupId: string, text: string) => Promise<void>;
  
  // AI actions
  loadPredictions: () => Promise<void>;
  loadInsights: () => Promise<void>;
  
  // Utility actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

// Generate random invite code
const generateInviteCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// Generate MongoDB ObjectId format
const generateObjectId = () => {
  const timestamp = Math.floor(Date.now() / 1000).toString(16);
  const randomHex = 'xxxxxxxxxxxx'.replace(/[x]/g, () => {
    return (Math.random() * 16 | 0).toString(16);
  });
  return timestamp + randomHex;
};

// Mock API functions for demo
const mockAPI = {
  auth: {
    login: async (email: string, password: string) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (email && password) {
        return {
          token: 'mock-jwt-token-' + Date.now(),
          user: {
            _id: 'user_' + Date.now(),
            name: email.split('@')[0],
            email: email,
            avatar: '👤',
            preferences: {
              notifications: true,
              biometric: false,
              darkMode: false,
              currency: 'INR',
            }
          }
        };
      }
      throw new Error('Invalid credentials');
    },
    register: async (userData: { name: string; email: string; password: string }) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (userData.name && userData.email && userData.password) {
        return {
          token: 'mock-jwt-token-' + Date.now(),
          user: {
            _id: 'user_' + Date.now(),
            name: userData.name,
            email: userData.email,
            avatar: '👤',
            preferences: {
              notifications: true,
              biometric: false,
              darkMode: false,
              currency: 'INR',
            }
          }
        };
      }
      throw new Error('Registration failed');
    }
  }
};

export const useFinanceStore = create<FinanceState>((set, get) => ({
  currentUser: null,
  isAuthenticated: false,
  authToken: null,
  expenses: [],
  splitBills: [],
  budgets: {},
  groups: [],
  selectedGroup: null,
  messages: {},
  predictions: [],
  insights: [],
  isLoading: false,
  error: null,

  // Auth actions
  clearStorage: async () => {
    try {
      await AsyncStorage.clear();
      set({
        currentUser: null,
        isAuthenticated: false,
        authToken: null,
        expenses: [],
        splitBills: [],
        budgets: {},
        groups: [],
        selectedGroup: null,
        messages: {},
        predictions: [],
        insights: [],
        isLoading: false,
        error: null,
      });
      console.log('Storage cleared successfully');
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  },

  login: async (email: string, password: string) => {
    try {
      set({ isLoading: true, error: null });
      
      const response = await authAPI.login({ email, password });
      
      if (response.token && response.user) {
        await AsyncStorage.setItem('authToken', response.token);
        await AsyncStorage.setItem('userData', JSON.stringify(response.user));
        
        set({
          isAuthenticated: true,
          authToken: response.token,
          currentUser: response.user,
          groups: Array.isArray(response.user.groups) ? response.user.groups : [],
          selectedGroup: Array.isArray(response.user.groups) ? response.user.groups[0] || null : null,
          isLoading: false,
        });
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || error.message || 'Login failed',
        isLoading: false,
        groups: [], // Ensure groups is always an array
      });
      throw error;
    }
  },

  updateProfile: async (userData: User) => {
    try {
      // Update stored user data
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
      
      // Update state
      set({
        currentUser: userData,
        error: null
      });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to update profile'
      });
      throw error;
    }
  },

  register: async (userData: { name: string; email: string; username: string; password: string }) => {
    try {
      set({ isLoading: true, error: null });
      
      // Validate username
      if (!userData.username || userData.username.length < 3) {
        throw new Error('Username must be at least 3 characters long');
      }
      
      const response = await authAPI.register(userData);
      
      if (response.token && response.user) {
        await AsyncStorage.setItem('authToken', response.token);
        await AsyncStorage.setItem('userData', JSON.stringify(response.user));
        
        set({
          isAuthenticated: true,
          authToken: response.token,
          currentUser: response.user,
          groups: Array.isArray(response.user.groups) ? response.user.groups : [],
          selectedGroup: Array.isArray(response.user.groups) ? response.user.groups[0] || null : null,
          isLoading: false,
        });
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || error.message || 'Registration failed',
        isLoading: false,
        groups: [], // Ensure groups is always an array
      });
      throw error;
    }
  },

  logout: async () => {
    try {
      set({ isLoading: true, error: null });

      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userData');

      set({
        isAuthenticated: false,
        authToken: null,
        currentUser: null,
        groups: [],
        selectedGroup: null,
        expenses: [],
        splitBills: [],
        budgets: {},
        messages: {},
        predictions: [],
        insights: [],
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.message || 'Logout failed',
        isLoading: false,
      });
      // Even if error, clear local state and ensure arrays are initialized
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userData');
      set({
        isAuthenticated: false,
        authToken: null,
        currentUser: null,
        groups: [],
        selectedGroup: null,
        expenses: [],
        splitBills: [],
        budgets: {},
        messages: {},
        predictions: [],
        insights: [],
        isLoading: false,
      });
    }
  },

  signout: async () => {
    try {
      set({ isLoading: true, error: null });
      
      await authAPI.logout();
      
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userData');
      
      set({
        isAuthenticated: false,
        authToken: null,
        currentUser: null,
        groups: [],
        selectedGroup: null,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.message || 'Signout failed',
        isLoading: false,
      });
      // Even if the API call fails, we should still clear local state
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userData');
      set({
        isAuthenticated: false,
        authToken: null,
        currentUser: null,
        groups: [],
        selectedGroup: null,
        isLoading: false,
      });
    }
  },

  loadStoredAuth: async () => {
    try {
      const [token, userData] = await AsyncStorage.multiGet(['authToken', 'userData']);
      
      if (token[1] && userData[1]) {
        const user = JSON.parse(userData[1]);
        
        set({
          isAuthenticated: true,
          authToken: token[1],
          currentUser: user,
          groups: [],
          selectedGroup: null,
          expenses: [], // Ensure arrays are always initialized
          splitBills: [],
          budgets: {},
          messages: {},
          predictions: [],
          insights: [],
        });
        
        // Load real groups from backend after authentication is set
        try {
          await get().loadGroups();
          
          // After loading groups, set the first group as selected if available
          const groups = get().groups;
          if (Array.isArray(groups) && groups.length > 0) {
            set({ selectedGroup: groups[0] });
          }
        } catch (error) {
          console.error('Error loading groups after auth restore:', error);
          // Don't throw error, just log it - user can still use the app
        }
      }
    } catch (error) {
      console.error('Load stored auth error:', error);
      
      // If there's corruption in stored data, clear it and start fresh
      try {
        await AsyncStorage.clear();
        console.log('Cleared corrupted storage data');
      } catch (clearError) {
        console.error('Error clearing corrupted storage:', clearError);
      }
      
      // Ensure all arrays are initialized even on error
      set({
        currentUser: null,
        isAuthenticated: false,
        authToken: null,
        groups: [],
        expenses: [],
        splitBills: [],
        budgets: {},
        messages: {},
        predictions: [],
        insights: [],
      });
    }
  },

  // Expense actions
  addExpense: async (expenseData: CreateExpenseData) => {
    try {
      set({ isLoading: true, error: null });
      const response = await expensesAPI.addExpense(expenseData);
      if (!response.data || !response.data._id) {
        throw new Error('Invalid response from server');
      }
      set((state) => ({
        expenses: [...state.expenses, response.data],
        isLoading: false
      }));
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || error.message || 'Failed to add expense',
        isLoading: false 
      });
      throw error;
    }
  },

  loadExpenses: async () => {
    try {
      set({ isLoading: true, error: null });
      const response = await expensesAPI.getExpenses();
      set({ 
        expenses: Array.isArray(response.expenses) ? response.expenses : [],
        error: null,
        isLoading: false 
      });
    } catch (error: any) {
      console.error('Load expenses error:', error);
      let errorMessage = 'Failed to load expenses';
      
      if (error.message === 'Network Error') {
        errorMessage = 'Network error: Please check your internet connection and try again';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      set({ 
        error: errorMessage,
        expenses: [], // Always ensure we have an array
        isLoading: false 
      });
      
      // Optional: Show alert for better user experience
      Alert.alert('Error', errorMessage);
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

  // Split bill actions
  createSplitBill: async (data: CreateSplitBillParams): Promise<SplitBill> => {
    try {
      set({ isLoading: true, error: null });
      const response = await SplitBillService.createSplitBill(data);
      
      if (!response.splitBill) {
        throw new Error('Invalid response from server');
      }

      set((state) => ({
        splitBills: [...(state.splitBills || []), response.splitBill],
        isLoading: false
      }));

      // Also update the group's split bills if this is a group expense
      if (data.groupId) {
        const groups = get().groups;
        const group = Array.isArray(groups) ? groups.find(g => g._id === data.groupId) : null;
        if (group) {
          get().loadGroups(); // Refresh groups to get updated expenses
        }
      }

      return response.splitBill;
    } catch (error: any) {
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
        splitBills: [], // Ensure array is always initialized
        isLoading: false 
      });
      throw error;
    }
  },

  getGroupSplitBills: async (groupId: string, page = 1, limit = 20): Promise<SplitBillsResponse> => {
    try {
      set({ isLoading: true, error: null });
      const response = await SplitBillService.getGroupSplitBills(groupId, page, limit);
      
      if (!response.splitBills) {
        throw new Error('Invalid response from server');
      }

      set((state) => ({
        splitBills: response.splitBills,
        isLoading: false
      }));

      return response;
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || error.message || 'Failed to get group split bills',
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

  // Budget actions
  setBudget: async (category, amount, groupId) => {
    try {
      set({ isLoading: true, error: null });
      const response = await budgetsAPI.setBudget({ category, amount, groupId });

      // The budgetsAPI.setBudget already extracts the data property
      // So response.budgets contains the updated budget object directly
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
        // If no budgets returned, reload them
        await get().loadBudgets(groupId);
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || error.message || 'Failed to set budget',
        isLoading: false
      });
      throw error;
    }
  },

  loadBudgets: async (groupId) => {
    try {
      set({ isLoading: true, error: null });
      const response = await budgetsAPI.getBudgets(groupId);

      // The budgetsAPI.getBudgets already extracts the data property
      // So response.budgets contains the budget object directly
      if (response && response.budgets) {
        // Ensure budgets is an object with category keys
        const budgets = typeof response.budgets === 'object' && !Array.isArray(response.budgets)
          ? response.budgets
          : {};
        set({
          budgets: budgets,
          error: null,
          isLoading: false
        });
      } else {
        // If no budgets exist yet, set to empty object
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
        budgets: {}, // Reset to empty object on error
        isLoading: false
      });

      // Show alert for better user experience
      Alert.alert('Error', errorMessage);
    }
  },

  // Group actions
  loadGroups: async () => {
    try {
      set({ isLoading: true, error: null });
      const response = await groupsAPI.getGroups();
      // Handle both formats: {groups: [...]} or {data: {groups: [...]}}
      let groups: any[] = [];
      if (response && typeof response === 'object') {
        if ('groups' in response && Array.isArray(response.groups)) {
          groups = response.groups;
        } else if ('data' in response && response.data && typeof response.data === 'object' && 'groups' in response.data && Array.isArray(response.data.groups)) {
          groups = response.data.groups;
        } else if (Array.isArray(response)) {
          groups = response;
        }
      }
      set({
        groups: groups,
        isLoading: false
      });
    } catch (error: any) {
      console.error('Load groups error:', error);
      set({ 
        error: error.response?.data?.message || error.message || 'Failed to load groups',
        groups: [], // Ensure groups is always an array even on error
        isLoading: false 
      });
    }
  },

  createGroup: async (groupData) => {
    try {
      set({ isLoading: true, error: null });
      const response = await groupsAPI.createGroup(groupData);
      // Handle both formats: {group: {...}} or {data: {group: {...}}}
      const group = response.group || response.data?.group;
      if (group) {
        set((state) => ({
          groups: [...(state.groups || []), group],
          isLoading: false
        }));
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || error.message || 'Failed to create group',
        isLoading: false 
      });
      throw error;
    }
  },

  joinGroupByCode: async (inviteCode: string) => {
    try {
      set({ isLoading: true, error: null });
      const currentUser = get().currentUser;
      if (!currentUser) throw new Error('User not authenticated');
      
      const response = await groupsAPI.joinGroup(inviteCode);
      
      // Handle multiple response formats
      const group = response.group || response.data?.group || response.data?.data?.group;
      
      if (!group) {
        throw new Error('Invalid response from server');
      }
      
      set((state) => ({
        groups: [...(state.groups || []), group],
        selectedGroup: group,
        isLoading: false,
        error: null
      }));
      
      Alert.alert('Success', 'Successfully joined the group!');
      router.replace('/(tabs)');
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || 'Failed to join group';
      set({ 
        error: errorMsg,
        isLoading: false 
      });
      Alert.alert('Error', errorMsg);
      throw error;
    }
  },

  selectGroup: (group: Group) => {
    set({ selectedGroup: group });
  },

  generateInviteLink: (groupId: string) => {
    const groups = get().groups;
    const group = Array.isArray(groups) ? groups.find(g => g._id === groupId) : null;
    if (!group) return '';
    
    return `https://securefinance.app/join/${group.inviteCode}`;
  },

  addMemberToGroup: async (groupId: string, identifier: string, searchType: 'email' | 'username' = 'email') => {
    try {
      set({ isLoading: true, error: null });

      const response = await groupsAPI.addMember(groupId, identifier, searchType);
      
      if (!response || !response.group) {
        throw new Error('Invalid response from server');
      }

      set((state) => ({
        groups: Array.isArray(state.groups) ? state.groups.map(group =>
          group._id === groupId ? response.group : group
        ) : [],
        selectedGroup: state.selectedGroup?._id === groupId 
          ? response.group 
          : state.selectedGroup,
        isLoading: false,
        error: null
      }));

      Alert.alert('Success', 'Member added successfully');
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || 'Failed to add member';
      set({ 
        error: errorMsg,
        isLoading: false 
      });
      Alert.alert('Error', errorMsg);
      throw error;
    }
  },

  // Chat actions
  loadMessages: async (groupId: string) => {
    try {
      set({ isLoading: true, error: null });
      const response = await chatAPI.getMessages(groupId);
      if (response.status === 'success' && response.data?.messages) {
        set((state) => ({
          messages: {
            ...state.messages,
            [groupId]: response.data.messages
          },
          isLoading: false
        }));
      }
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || error.message || 'Failed to load messages',
        isLoading: false 
      });
      throw error;
    }
  },

  sendMessage: async (groupId: string, text: string) => {
    try {
      set({ isLoading: true, error: null });
      const currentUser = get().currentUser;
      if (!currentUser) throw new Error('User not authenticated');
      
      const response = await chatAPI.sendMessage(groupId, { 
        text,
        type: 'text',
        status: 'sent'
      });

      if (response.status === 'success' && response.data?.message) {
        set((state) => ({
          messages: {
            ...state.messages,
            [groupId]: [...(state.messages[groupId] || []), response.data.message]
          },
          isLoading: false
        }));
      }
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || error.message || 'Failed to send message',
        isLoading: false 
      });
      throw error;
    }
  },

  // AI actions
  loadPredictions: async () => {
    try {
      set({ isLoading: true, error: null });
      
      // Use free AI service instead of backend API
      const expenses = get().expenses;
      const budgets = get().budgets;
      
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
      
      // Use free AI service instead of backend API
      const expenses = get().expenses;
      const budgets = get().budgets;
      
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

  // Utility actions
  setLoading: (loading: boolean) => set({ isLoading: loading }),
  setError: (error: string | null) => set({ error }),
  clearError: () => set({ error: null }),
}));