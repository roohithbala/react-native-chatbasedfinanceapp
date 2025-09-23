import type { Message } from '@/app/types/chat';
import type {
  SplitBill,
  CreateSplitBillParams,
  GetSplitBillsParams,
  SplitBillsResponse,
  SplitBillStats
} from '../services/splitBillService';

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
    userId: User; // Populated user object
    role: 'admin' | 'member';
    joinedAt?: string;
    isActive?: boolean;
  }[];
  budgets: {
    category: string;
    amount: number;
    period: string;
  }[];
}

export interface FinanceState {
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
  testConnectivity: () => Promise<{ success: boolean; message: string }>;
  initializeSocketListeners: () => void;
}