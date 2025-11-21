import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { 
  authAPI, 
  expensesAPI, 
  groupsAPI, 
  chatAPI,
  budgetsAPI,
  checkServerConnectivity
} from '../services/api';
import type { Message } from '../../app/types/chat';
import type { 
  SplitBill,
  CreateSplitBillParams, 
  GetSplitBillsParams,
  SplitBillsResponse,
  SplitBillStats 
} from '../services/splitBillService';
import SplitBillService from '../services/splitBillService';
import freeAIService, { SpendingAnalysis } from '../services/freeAIService';
import socketService from '../services/socketService';
import biometricAuthService from '../services/biometricAuthService';
import { API_BASE_URL } from '../services/apiConfig';
import { useBudgetsStore } from './budgetsStore';

export type { SplitBill };

export interface User {
  _id: string;
  name: string;
  username: string;
  email: string;
  upiId: string;
  paymentMethods?: string[];
  avatar: string;
  preferences?: {
    notifications: boolean;
    biometric: boolean;
    biometricType?: 'fingerprint' | 'facial' | 'iris';
    darkMode: boolean;
    currency: string;
  };
}

export interface Expense {
  _id: string;
  description: string;
  amount: number;
  category: string;
  userId: string | User;
  groupId?: string;
  createdAt: Date;
  tags?: string[];
}

export interface CreateExpenseData {
  description: string;
  amount: number;
  category: string;
  userId: string;
  groupId?: string;
  tags?: string[];
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
  login: (credentials: { email?: string; username?: string; password: string }) => Promise<{ requiresOTP: boolean; email?: string; message?: string; otp?: string } | undefined>;
  register: (userData: { name: string; email: string; username: string; password: string; upiId: string }) => Promise<{ requiresOTP: boolean; email?: string; message?: string; otp?: string; tempId?: string } | undefined>;
  verifySignupOTP: (tempId: string, otp: string) => Promise<void>;
  resendSignupOTP: (tempId: string) => Promise<any>;
  logout: () => Promise<void>;
  loadStoredAuth: () => Promise<void>;
  updateProfile: (userData: User) => Promise<void>;
  biometricLogin: () => Promise<void>;
  updateBiometricPreference: (enabled: boolean) => Promise<void>;
  googleAuth: (idToken: string) => Promise<void>;
  sendOTP: (email: string) => Promise<any>;
  verifyOTP: (email: string, otp: string) => Promise<any>;
  otpLogin: (email: string, otp: string) => Promise<void>;
  
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
  rejectSplitBill: (id: string) => Promise<SplitBill>;
  getSplitBillStats: (groupId?: string, period?: 'week' | 'month' | 'year') => Promise<SplitBillStats>;
  
  // Budget actions
  setBudget: (category: string, amount: number) => Promise<void>;
  loadBudgets: () => Promise<void>;
  
  // Group actions
  loadGroups: () => Promise<void>;
  createGroup: (groupData: any) => Promise<void>;
  updateGroup: (groupId: string, groupData: any) => Promise<void>;
  deleteGroup: (groupId: string) => Promise<void>;
  joinGroupByCode: (inviteCode: string) => Promise<void>;
  selectGroup: (group: Group) => void;
  generateInviteLink: (groupId: string) => string;
  addMemberToGroup: (groupId: string, identifier: string, searchType?: 'email' | 'username') => Promise<void>;
  removeMemberFromGroup: (groupId: string, memberId: string) => Promise<void>;
  
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
              biometricType: undefined,
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
              biometricType: undefined,
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

  login: async (credentials: { email?: string; username?: string; password: string }): Promise<{ requiresOTP: boolean; email?: string; message?: string; otp?: string } | undefined> => {
    try {
      set({ isLoading: true, error: null });
      
      const response = await authAPI.login(credentials);
      
      // Check if OTP is required (new mandatory OTP flow)
      if (response.requiresOTP) {
        set({ isLoading: false });
        // Return the OTP requirement info instead of throwing error
        return {
          requiresOTP: true,
          email: response.email,
          message: response.message,
          otp: response.otp // Only in development
        };
      }
      
      // Legacy flow - direct token return (shouldn't happen with new backend)
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

        // Load all user data after successful login
        try {
          console.log('Loading user data after login...');
          
          // Load groups first
          await get().loadGroups();
          
          // After loading groups, set the first group as selected if available
          const groups = get().groups;
          if (Array.isArray(groups) && groups.length > 0) {
            set({ selectedGroup: groups[0] });
          }
          
          // Load other data in parallel
          await Promise.all([
            get().loadExpenses(),
            get().loadBudgets(),
            get().getSplitBills()
          ]);
          
          console.log('All user data loaded successfully after login');
          
          // Initialize socket listeners for real-time updates
          get().initializeSocketListeners();
        } catch (error) {
          console.error('Error loading data after login:', error);
          // Don't throw error, just log it - user can still use the app
        }
        
        return undefined; // Legacy flow - authentication successful, no OTP required
      } else {
        // Unexpected response shape from login endpoint - surface a clearer message
        throw new Error('Unexpected authentication response from server');
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

  biometricLogin: async () => {
    try {
      console.log('🔐 Starting biometric login...');
      set({ isLoading: true, error: null });

      // Check if biometric is enabled
      console.log('Checking if biometric is enabled...');
      const biometricEnabled = await biometricAuthService.isBiometricEnabled();
      console.log('Biometric enabled:', biometricEnabled);

      if (!biometricEnabled) {
        throw new Error('Biometric authentication is not enabled');
      }

      // Perform biometric authentication
      console.log('Performing biometric authentication...');
      const authResult = await biometricAuthService.authenticateForAppUnlock();
      console.log('Biometric auth result:', authResult);

      if (!authResult.success) {
        throw new Error(authResult.error || 'Biometric authentication failed');
      }

      // For biometric login, we need stored credentials
      // In a real app, you'd store encrypted credentials or use a token-based approach
      console.log('Retrieving stored credentials...');
      const storedUserData = await AsyncStorage.getItem('userData');
      const storedToken = await AsyncStorage.getItem('authToken');

      console.log('Stored data check:', {
        hasUserData: !!storedUserData,
        hasToken: !!storedToken,
        userDataLength: storedUserData?.length,
        tokenLength: storedToken?.length
      });

      if (!storedUserData || !storedToken) {
        throw new Error('No stored credentials found. Please login with email and password first to enable biometric authentication.');
      }

      let user;
      try {
        user = JSON.parse(storedUserData);
        console.log('Parsed user data:', { id: user._id, name: user.name, email: user.email });
      } catch (parseError) {
        console.error('Error parsing stored user data:', parseError);
        // Clear corrupted data
        await AsyncStorage.removeItem('userData');
        await AsyncStorage.removeItem('authToken');
        throw new Error('Stored user data is corrupted. Please login again.');
      }

      console.log('Setting authentication state...');
      set({
        isAuthenticated: true,
        authToken: storedToken,
        currentUser: user,
        groups: Array.isArray(user.groups) ? user.groups : [],
        selectedGroup: Array.isArray(user.groups) ? user.groups[0] || null : null,
        isLoading: false,
      });

      // Load all user data after successful biometric login
      try {
        console.log('Loading user data after biometric login...');

        // Load groups first
        await get().loadGroups();

        // After loading groups, set the first group as selected if available
        const groups = get().groups;
        if (Array.isArray(groups) && groups.length > 0) {
          set({ selectedGroup: groups[0] });
        }

        // Load other data in parallel
        await Promise.all([
          get().loadExpenses(),
          get().loadBudgets(),
          get().getSplitBills()
        ]);

        console.log('All user data loaded successfully after biometric login');

        // Initialize socket listeners for real-time updates
        get().initializeSocketListeners();

        console.log('✅ Biometric login completed successfully');
      } catch (error) {
        console.error('Error loading data after biometric login:', error);
        // Don't throw error, just log it - user can still use the app
      }

    } catch (error: any) {
      console.error('❌ Biometric login failed:', error);
      set({
        error: error.message || 'Biometric login failed',
        isLoading: false,
      });
      throw error;
    }
  },

  updateBiometricPreference: async (enabled: boolean) => {
    try {
      set({ isLoading: true, error: null });

      if (enabled) {
        // Try to enable biometric authentication
        const result = await biometricAuthService.enableBiometric();
        if (!result.success) {
          throw new Error(result.error || 'Failed to enable biometric authentication');
        }
      } else {
        // Disable biometric authentication
        await biometricAuthService.disableBiometric();
      }

      // Update user preferences if we have a current user
      const currentUser = get().currentUser;
      if (currentUser) {
        const updatedUser = {
          ...currentUser,
          preferences: {
            notifications: currentUser.preferences?.notifications ?? true,
            biometric: enabled,
            biometricType: enabled ? await biometricAuthService.getStoredBiometricType() || undefined : undefined,
            darkMode: currentUser.preferences?.darkMode ?? false,
            currency: currentUser.preferences?.currency ?? 'INR',
          }
        };

        // Update stored user data
        await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));

        // Update state
        set({
          currentUser: updatedUser,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }

    } catch (error: any) {
      set({
        error: error.message || 'Failed to update biometric preference',
        isLoading: false,
      });
      throw error;
    }
  },

  googleAuth: async (idToken: string) => {
    try {
      set({ isLoading: true, error: null });

      const response = await authAPI.googleAuth(idToken);

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

        // Load all user data after successful Google authentication
        try {
          console.log('Loading user data after Google auth...');

          // Load groups first
          await get().loadGroups();

          // After loading groups, set the first group as selected if available
          const groups = get().groups;
          if (Array.isArray(groups) && groups.length > 0) {
            set({ selectedGroup: groups[0] });
          }

          // Load other data in parallel
          await Promise.all([
            get().loadExpenses(),
            get().loadBudgets(),
            get().getSplitBills()
          ]);

          console.log('All user data loaded successfully after Google auth');

          // Initialize socket listeners for real-time updates
          get().initializeSocketListeners();
        } catch (error) {
          console.error('Error loading data after Google auth:', error);
          // Don't throw error, just log it - user can still use the app
        }
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || error.message || 'Google authentication failed',
        isLoading: false,
        groups: [], // Ensure groups is always an array
      });
      throw error;
    }
  },

  sendOTP: async (email: string) => {
    try {
      set({ isLoading: true, error: null });
      const response = await authAPI.sendOTP(email);
      set({ isLoading: false });
      return response;
    } catch (error: any) {
      set({
        error: error.response?.data?.message || error.message || 'Failed to send OTP',
        isLoading: false
      });
      throw error;
    }
  },

  verifyOTP: async (email: string, otp: string) => {
    try {
      set({ isLoading: true, error: null });
      const response = await authAPI.verifyOTP(email, otp);
      set({ isLoading: false });
      return response;
    } catch (error: any) {
      set({
        error: error.response?.data?.message || error.message || 'OTP verification failed',
        isLoading: false
      });
      throw error;
    }
  },

  otpLogin: async (email: string, otp: string) => {
    try {
      set({ isLoading: true, error: null });

      const response = await authAPI.otpLogin(email, otp);

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

        // Load all user data after successful OTP authentication
        try {
          console.log('Loading user data after OTP auth...');

          // Load groups first
          await get().loadGroups();

          // After loading groups, set the first group as selected if available
          const groups = get().groups;
          if (Array.isArray(groups) && groups.length > 0) {
            set({ selectedGroup: groups[0] });
          }

          // Load other data in parallel
          await Promise.all([
            get().loadExpenses(),
            get().loadBudgets(),
            get().getSplitBills()
          ]);

          console.log('All user data loaded successfully after OTP auth');

          // Initialize socket listeners for real-time updates
          get().initializeSocketListeners();
        } catch (error) {
          console.error('Error loading data after OTP auth:', error);
          // Don't throw error, just log it - user can still use the app
        }
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || error.message || 'OTP authentication failed',
        isLoading: false,
        groups: [], // Ensure groups is always an array
      });
      throw error;
    }
  },

  register: async (userData: { name: string; email: string; username: string; password: string; upiId: string }) => {
    try {
      set({ isLoading: true, error: null });
      
      // Validate username
      if (!userData.username || userData.username.length < 3) {
        throw new Error('Username must be at least 3 characters long');
      }
      
      const response = await authAPI.register(userData);
      
      set({ isLoading: false });

      // Return the response to indicate if OTP is required
      return response;
    } catch (error: any) {
      set({
        error: error.response?.data?.message || error.message || 'Registration failed',
        isLoading: false,
      });
      throw error;
    }
  },

  verifySignupOTP: async (tempId: string, otp: string) => {
    try {
      set({ isLoading: true, error: null });

      const response = await authAPI.verifySignupOTP(tempId, otp);

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

        // Load all user data after successful OTP verification
        try {
          console.log('Loading user data after signup OTP verification...');

          // Load groups first
          await get().loadGroups();

          // After loading groups, set the first group as selected if available
          const groups = get().groups;
          if (Array.isArray(groups) && groups.length > 0) {
            set({ selectedGroup: groups[0] });
          }

          // Load other data in parallel
          await Promise.all([
            get().loadExpenses(),
            get().loadBudgets(),
            get().getSplitBills()
          ]);

          console.log('All user data loaded successfully after signup OTP verification');

          // Initialize socket listeners for real-time updates
          get().initializeSocketListeners();
        } catch (error) {
          console.error('Error loading data after signup OTP verification:', error);
          // Don't throw error, just log it - user can still use the app
        }
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || error.message || 'OTP verification failed',
        isLoading: false,
      });
      throw error;
    }
  },

  resendSignupOTP: async (tempId: string) => {
    try {
      set({ isLoading: true, error: null });
      const response = await authAPI.resendSignupOTP(tempId);
      set({ isLoading: false });
      return response;
    } catch (error: any) {
      set({
        error: error.response?.data?.message || error.message || 'Failed to resend OTP',
        isLoading: false
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
        
        // First, set authentication state optimistically
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
        
        console.log('Authentication restored, validating token...');
        
        // Try to validate the token with a simple API call before loading all data
        try {
          // Use a simple health check or user profile endpoint to validate token
          const response = await fetch(`${API_BASE_URL.replace('/api', '')}/api/health`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token[1]}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (!response.ok) {
            throw new Error(`Token validation failed: ${response.status}`);
          }
          
          console.log('Token validated successfully, loading user data...');
          
          // Token is valid, proceed with loading data
          await get().loadGroups();
          
          // After loading groups, set the first group as selected if available
          const groups = get().groups;
          if (Array.isArray(groups) && groups.length > 0) {
            set({ selectedGroup: groups[0] });
          }
          
          // Load other data after groups are loaded
          await Promise.all([
            get().loadExpenses(),
            get().loadBudgets(),
            get().getSplitBills()
          ]);
          
          console.log('All user data loaded successfully');
          
          // Initialize socket listeners for real-time updates
          get().initializeSocketListeners();
          
        } catch (validationError) {
          console.error('Token validation failed:', validationError);
          
          // Token is invalid/expired, clear authentication state
          console.log('Clearing invalid authentication state...');
          await AsyncStorage.removeItem('authToken');
          await AsyncStorage.removeItem('userData');
          
          set({
            isAuthenticated: false,
            authToken: null,
            currentUser: null,
            groups: [],
            expenses: [],
            splitBills: [],
            budgets: {},
            messages: {},
            predictions: [],
            insights: [],
          });
          
          console.log('Authentication state cleared due to invalid token');
        }
      } else {
        // No stored auth data, ensure clean state
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
      
      // Handle backend response format: { message: '...', data: expense }
      const expense = response.data || response;
      if (!expense || !expense._id) {
        throw new Error('Invalid response from server');
      }
      
      set((state) => ({
        expenses: [...state.expenses, expense],
        isLoading: false
      }));

      // If this expense belongs to a budget category, record spent amount per category (don't mutate original limits)
      try {
        const category = expense.category || expenseData.category;
        const amount = Number(expense.amount || expenseData.amount) || 0;
        if (category && amount > 0) {
          const bState = useBudgetsStore.getState();
          if (bState && typeof bState.incrementSpentForCategory === 'function') {
            bState.incrementSpentForCategory(category, amount);
            console.log(`🔻 Recorded spent ${amount} for budget category '${category}'`);
          } else {
            // Fallback: update budgetsStore state directly
            try {
              useBudgetsStore.setState((s: any) => {
                const prev = s.spentByCategory || {};
                const prevVal = Number(prev[category]) || 0;
                return { spentByCategory: { ...prev, [category]: prevVal + amount } };
              });
            } catch (inner) {
              console.warn('Failed to record spentByCategory fallback:', inner);
            }
          }
        }
          // Also, if we have a cached historicalBudgets entry for the expense's period, append the expense there
          try {
            const createdAt = expense.createdAt ? new Date(expense.createdAt) : new Date();
            const y = createdAt.getFullYear();
            const m = createdAt.getMonth() + 1;
            const monthKey = `${y}-${String(m).padStart(2, '0')}`;
            const yearKey = String(y);
            const hbState = useBudgetsStore.getState();
            if (hbState && hbState.historicalBudgets && typeof hbState.historicalBudgets === 'object') {
              const updatePeriod = (key: string) => {
                try {
                  const existing = hbState.historicalBudgets[key];
                  if (!existing) return;
                  const prevExpenses = Array.isArray(existing.expenses) ? existing.expenses : [];
                  const newExpenses = [...prevExpenses, expense];
                  const prevByCat = existing.expensesByCategory || {};
                  const catKey = String(category || expense.category || expense.categoryName || (expense.tags && expense.tags[0]) || 'Other');
                  const prevArr = Array.isArray(prevByCat[catKey]) ? prevByCat[catKey] : [];
                  const newByCat = { ...prevByCat, [catKey]: [...prevArr, expense] };
                  const newPeriod = { ...existing, expenses: newExpenses, expensesByCategory: newByCat };
                  useBudgetsStore.setState({ historicalBudgets: { ...hbState.historicalBudgets, [key]: newPeriod } });
                  console.log(`📥 Appended expense ${expense._id} to historicalBudgets[${key}]`);
                } catch (err) {
                  console.warn('Failed to append expense to historical period', key, err);
                }
              };

              updatePeriod(monthKey);
              updatePeriod(yearKey);
            }
          } catch (hbErr) {
            console.warn('Error updating historicalBudgets cache with new expense:', hbErr);
          }
      } catch (deductErr) {
        console.warn('Error recording expense spent for budgets:', deductErr);
      }
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

      // Check for error flags
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

      // Ensure we always have an array
      const expenses = Array.isArray(response?.expenses) ? response.expenses : [];

      console.log(`Setting ${expenses.length} expenses in store`);
      set({
        expenses: expenses,
        error: null,
        isLoading: false
      });

      // Initialize spentByCategory in budgets store so historical/current summaries have initial state
      try {
        const spentMap: { [k: string]: number } = {};
        expenses.forEach((exp: any) => {
          if (!exp || !exp.category) return;
          const key = String(exp.category);
          spentMap[key] = (spentMap[key] || 0) + (Number(exp.amount) || 0);
        });
        useBudgetsStore.setState({ spentByCategory: spentMap });
        console.log('Initialized budgetsStore.spentByCategory with', Object.keys(spentMap).length, 'categories');
      } catch (e) {
        console.warn('Failed to initialize spentByCategory from expenses:', e);
      }

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
        // Clear auth state on 401
        set({
          isAuthenticated: false,
          authToken: null,
          currentUser: null,
          groups: [],
          expenses: [],
          splitBills: [],
          budgets: {},
          messages: {},
          predictions: [],
          insights: [],
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
        expenses: [], // Always ensure we have an array
        isLoading: false
      });

      // Optional: Show alert for better user experience
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

  // Split bill actions
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

      // Also update the group's split bills if this is a group expense
      if (data.groupId) {
        const groups = get().groups;
        const group = Array.isArray(groups) ? groups.find(g => g._id === data.groupId) : null;
        if (group) {
          get().loadGroups(); // Refresh groups to get updated expenses
        }
      }

      // Automatically create an expense for the split bill
      try {
        const currentUser = get().currentUser;
        if (currentUser) {
          // Find the current user's share in the split bill
          const userParticipant = response.splitBill.participants.find(
            (p: any) => {
              if (typeof p.userId === 'object' && p.userId && '_id' in p.userId) {
                return (p.userId as any)._id === currentUser._id;
              } else if (typeof p.userId === 'string') {
                return p.userId === currentUser._id;
              }
              return false;
            }
          );

          if (userParticipant) {
            const expenseData: CreateExpenseData = {
              description: `Split bill: ${response.splitBill.description}`,
              amount: userParticipant.amount,
              category: response.splitBill.category || 'Other',
              userId: currentUser._id,
              groupId: response.splitBill.groupId,
              tags: ['split-bill', response.splitBill._id]
            };

            console.log('Creating expense for split bill:', expenseData);
            await get().addExpense(expenseData);
          }
        }
      } catch (expenseError) {
        console.error('Error creating expense for split bill:', expenseError);
        // Don't throw error for expense creation failure - split bill was created successfully
      }

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
      let errorMessage = 'Failed to get split bills';
      
      if (error.response?.status === 401) {
        errorMessage = 'Authentication failed. Please log in again.';
        // Clear auth state on 401
        set({
          isAuthenticated: false,
          authToken: null,
          currentUser: null,
          groups: [],
          expenses: [],
          splitBills: [],
          budgets: {},
          messages: {},
          predictions: [],
          insights: [],
        });
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      set({ 
        error: errorMessage,
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
      
      // Handle 403 (Forbidden) errors gracefully - don't throw or set global error
      if (error.response?.status === 403) {
        console.log('Group split bills access restricted - user may not have permission');
        set({ 
          splitBills: [], // Clear split bills for this group
          isLoading: false 
        });
        // Don't throw error for permission issues
        return { splitBills: [], totalPages: 0, currentPage: 1, total: 0 };
      } else if (error.response?.status === 401) {
        const errorMessage = 'Authentication failed. Please log in again.';
        // Clear auth state on 401
        set({
          isAuthenticated: false,
          authToken: null,
          currentUser: null,
          groups: [],
          expenses: [],
          splitBills: [],
          budgets: {},
          messages: {},
          predictions: [],
          insights: [],
          error: errorMessage,
          isLoading: false
        });
        throw new Error(errorMessage);
      }
      
      // For other errors, set error state and throw
      set({ 
        error: error.response?.data?.message || error.message || 'Failed to get group split bills',
        splitBills: [], // Ensure array is always initialized
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

      // Automatically create or update expense when user pays their share
      try {
        const currentUser = get().currentUser;
        if (currentUser) {
          // Find the current user's share in the updated split bill
          const userParticipant = response.splitBill.participants.find(
            (p: any) => {
              if (typeof p.userId === 'object' && p.userId && '_id' in p.userId) {
                return (p.userId as any)._id === currentUser._id;
              } else if (typeof p.userId === 'string') {
                return p.userId === currentUser._id;
              }
              return false;
            }
          );

          if (userParticipant && userParticipant.isPaid) {
            // Check if expense already exists for this split bill
            const existingExpense = get().expenses.find(
              exp => exp.tags?.includes(response.splitBill._id)
            );

            if (!existingExpense) {
              // Create new expense
              const expenseData: CreateExpenseData = {
                description: `Split bill payment: ${response.splitBill.description}`,
                amount: userParticipant.amount,
                category: response.splitBill.category || 'Other',
                userId: currentUser._id,
                groupId: response.splitBill.groupId,
                tags: ['split-bill-payment', response.splitBill._id]
              };

              console.log('Creating expense for split bill payment:', expenseData);
              await get().addExpense(expenseData);
            }
          }
        }
      } catch (expenseError) {
        console.error('Error creating expense for split bill payment:', expenseError);
        // Don't throw error for expense creation failure - payment was successful
      }

      return response.splitBill;
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || error.message || 'Failed to mark split bill as paid',
        isLoading: false 
      });
      throw error;
    }
  },

  rejectSplitBill: async (id: string): Promise<SplitBill> => {
    try {
      set({ isLoading: true, error: null });
      const response = await SplitBillService.rejectBill(id);
      
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
        error: error.response?.data?.message || error.message || 'Failed to reject split bill',
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
  setBudget: async (category: string, amount: number) => {
    try {
      set({ isLoading: true, error: null });
      const response = await budgetsAPI.setBudget({ category, amount });

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
      } else if (error.response?.status === 401) {
        errorMessage = 'Authentication failed. Please log in again.';
        // Clear auth state on 401
        set({
          isAuthenticated: false,
          authToken: null,
          currentUser: null,
          groups: [],
          expenses: [],
          splitBills: [],
          budgets: {},
          messages: {},
          predictions: [],
          insights: [],
        });
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
      console.log('Loading groups from store...');
      set({ isLoading: true, error: null });
      const response = await groupsAPI.getGroups();
      console.log('Groups API response:', response);
      
      // Handle both formats: {groups: [...]} or {data: {groups: [...]}}
      let groups: any[] = [];
      if (response && typeof response === 'object') {
        if ('groups' in response && Array.isArray(response.groups)) {
          groups = response.groups;
          console.log('Found groups in direct response:', groups.length);
        } else if ('data' in response && response.data && typeof response.data === 'object' && 'groups' in response.data && Array.isArray(response.data.groups)) {
          groups = response.data.groups;
          console.log('Found groups in data response:', groups.length);
        } else if (Array.isArray(response)) {
          groups = response;
          console.log('Response is array:', groups.length);
        }
      }
      
      console.log('Setting groups in store:', groups.length, 'groups');
      set({
        groups: groups,
        isLoading: false
      });
      
      console.log('Groups loaded successfully');
    } catch (error: any) {
      console.error('Load groups error:', error);
      let errorMessage = 'Failed to load groups';
      
      if (error.message === 'Network Error' || error.name === 'NetworkError' || !error.response) {
        errorMessage = 'Unable to connect to server. Please check your internet connection and ensure the server is running.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Authentication failed. Please log in again.';
        // Clear auth state on 401
        set({
          isAuthenticated: false,
          authToken: null,
          currentUser: null,
          groups: [],
          expenses: [],
          splitBills: [],
          budgets: {},
          messages: {},
          predictions: [],
          insights: [],
        });
      } else if (error.response?.status === 404) {
        errorMessage = 'Groups service not found. Please check server configuration.';
      } else if (error.response?.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      set({ 
        error: errorMessage,
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
        console.error('Invalid response structure:', response);
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

      Alert.alert('Success', response.message || 'Member added successfully');
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

  updateGroup: async (groupId: string, groupData: any) => {
    try {
      set({ isLoading: true, error: null });
      const response = await groupsAPI.updateGroup(groupId, groupData);
      
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

      Alert.alert('Success', 'Group updated successfully');
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || 'Failed to update group';
      set({ 
        error: errorMsg,
        isLoading: false 
      });
      Alert.alert('Error', errorMsg);
      throw error;
    }
  },

  deleteGroup: async (groupId: string) => {
    try {
      set({ isLoading: true, error: null });
      await groupsAPI.deleteGroup(groupId);
      
      set((state) => ({
        groups: Array.isArray(state.groups) ? state.groups.filter(group => group._id !== groupId) : [],
        selectedGroup: state.selectedGroup?._id === groupId ? null : state.selectedGroup,
        isLoading: false,
        error: null
      }));

      Alert.alert('Success', 'Group deleted successfully');
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || 'Failed to delete group';
      set({ 
        error: errorMsg,
        isLoading: false 
      });
      Alert.alert('Error', errorMsg);
      throw error;
    }
  },

  removeMemberFromGroup: async (groupId: string, memberId: string) => {
    try {
      set({ isLoading: true, error: null });
      const response = await groupsAPI.removeMember(groupId, memberId);
      
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

      Alert.alert('Success', 'Member removed successfully');
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || 'Failed to remove member';
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
      let errorMessage = 'Failed to load messages';
      
      if (error.response?.status === 401) {
        errorMessage = 'Authentication failed. Please log in again.';
        // Clear auth state on 401
        set({
          isAuthenticated: false,
          authToken: null,
          currentUser: null,
          groups: [],
          expenses: [],
          splitBills: [],
          budgets: {},
          messages: {},
          predictions: [],
          insights: [],
          error: errorMessage,
          isLoading: false
        });
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      set({ 
        error: errorMessage,
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
      let errorMessage = 'Failed to send message';
      
      if (error.response?.status === 401) {
        errorMessage = 'Authentication failed. Please log in again.';
        // Clear auth state on 401
        set({
          isAuthenticated: false,
          authToken: null,
          currentUser: null,
          groups: [],
          expenses: [],
          splitBills: [],
          budgets: {},
          messages: {},
          predictions: [],
          insights: [],
          error: errorMessage,
          isLoading: false
        });
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      set({ 
        error: errorMessage,
        isLoading: false 
      });
      throw error;
    }
  },

  // AI actions
  loadPredictions: async () => {
    try {
      set({ isLoading: true, error: null });

      // Try OpenRouter AI first, then fallback to backend Gemini
      const expenses = get().expenses;
      const budgets = get().budgets;

      let analysis: SpendingAnalysis;
      try {
        // Import OpenRouter service dynamically to avoid issues if not configured
        const { openRouterAIService } = await import('../services/openRouterAIService');
        analysis = await openRouterAIService.analyzeSpending(expenses, budgets);
        console.log('✅ Using OpenRouter AI for predictions');
      } catch (openRouterError) {
        console.log('⚠️ OpenRouter AI failed, falling back to backend Gemini:', openRouterError instanceof Error ? openRouterError.message : String(openRouterError));
        // Fallback to backend Gemini via existing freeAIService
        analysis = await freeAIService.analyzeSpending(expenses, budgets);
      }

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

      // Try OpenRouter AI first, then fallback to backend Gemini
      const expenses = get().expenses;
      const budgets = get().budgets;

      let analysis: SpendingAnalysis;
      try {
        // Import OpenRouter service dynamically to avoid issues if not configured
        const { openRouterAIService } = await import('../services/openRouterAIService');
        analysis = await openRouterAIService.analyzeSpending(expenses, budgets);
        console.log('✅ Using OpenRouter AI for insights');
      } catch (openRouterError) {
        console.log('⚠️ OpenRouter AI failed, falling back to backend Gemini:', openRouterError instanceof Error ? openRouterError.message : String(openRouterError));
        // Fallback to backend Gemini via existing freeAIService
        analysis = await freeAIService.analyzeSpending(expenses, budgets);
      }

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
  
  // Debug utility to test connectivity and data loading
  testConnectivity: async () => {
    try {
      console.log('🔍 Testing connectivity and data loading...');
      set({ isLoading: true, error: null });
      
      // Test server connectivity
      const isConnected = await checkServerConnectivity();
      console.log('Server connectivity:', isConnected);
      
      if (!isConnected) {
        throw new Error('Cannot connect to server. Please check if the backend is running and the IP address is correct.');
      }
      
      // Test authentication
      if (!get().authToken) {
        throw new Error('No authentication token found. Please log in again.');
      }
      
      console.log('Testing budgets API directly...');
      try {
        const budgetsResponse = await budgetsAPI.getBudgets();
        console.log('Budgets API test successful:', {
          hasBudgets: !!budgetsResponse?.budgets,
          budgetsType: typeof budgetsResponse?.budgets,
          budgetsKeys: budgetsResponse?.budgets ? Object.keys(budgetsResponse.budgets) : []
        });
      } catch (budgetError: any) {
        console.error('Budgets API test failed:', budgetError);
        throw new Error(`Budgets API failed: ${budgetError.message || 'Unknown error'}`);
      }
      
      // Test data loading
      console.log('Testing data loading...');
      const results = await Promise.allSettled([
        get().loadGroups(),
        get().loadExpenses(),
        get().loadBudgets(),
        get().getSplitBills()
      ]);
      
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const failureCount = results.filter(r => r.status === 'rejected').length;
      
      console.log(`Data loading results: ${successCount} success, ${failureCount} failures`);
      
      if (failureCount > 0) {
        const errors = results
          .filter(r => r.status === 'rejected')
          .map(r => (r as PromiseRejectedResult).reason?.message || 'Unknown error')
          .join('; ');
        throw new Error(`Some data failed to load: ${errors}`);
      }
      
      set({ isLoading: false });
      console.log('✅ Connectivity and data loading test passed!');
      return { success: true, message: 'All tests passed successfully!' };
      
    } catch (error: any) {
      console.error('❌ Connectivity test failed:', error);
      const errorMessage = error.message || 'Connectivity test failed';
      set({ error: errorMessage, isLoading: false });
      return { success: false, message: errorMessage };
    }
  },

  // Initialize socket listeners for real-time updates
  initializeSocketListeners: () => {
    const currentUser = get().currentUser;
    if (!currentUser) return;

    // Join user-specific room
    socketService.joinUserRoom(currentUser._id);

    // Listen for expense updates
    socketService.onExpenseUpdate((data) => {
      console.log('Real-time expense update:', data);
      const { type, expense, expenseId } = data;

      if (type === 'created' && expense) {
        set((state) => ({
          expenses: [...state.expenses, expense]
        }));
      } else if (type === 'updated' && expense) {
        set((state) => ({
          expenses: state.expenses.map(exp =>
            exp._id === expense._id ? expense : exp
          )
        }));
      } else if (type === 'deleted' && expenseId) {
        set((state) => ({
          expenses: state.expenses.filter(exp => exp._id !== expenseId)
        }));
      }
    });

    // Listen for group updates
    socketService.onGroupUpdate((data) => {
      console.log('Real-time group update:', data);
      const { type, group, groupId, member } = data;

      if (type === 'created' && group) {
        set((state) => ({
          groups: [...state.groups, group]
        }));
      } else if (type === 'updated' && group) {
        set((state) => ({
          groups: state.groups.map(g =>
            g._id === group._id ? group : g
          ),
          selectedGroup: state.selectedGroup?._id === group._id ? group : state.selectedGroup
        }));
      } else if (type === 'member-added' && groupId && member) {
        set((state) => ({
          groups: state.groups.map(g =>
            g._id === groupId ? {
              ...g,
              members: [...(g.members || []), member]
            } : g
          ),
          selectedGroup: state.selectedGroup && state.selectedGroup._id === groupId ? {
            ...state.selectedGroup,
            members: [...(state.selectedGroup.members || []), member]
          } : state.selectedGroup
        }));
      } else if (type === 'member-removed' && groupId) {
        const memberId = data.memberId;
        set((state) => ({
          groups: state.groups.map(g =>
            g._id === groupId ? {
              ...g,
              members: (g.members || []).filter(m => m.userId !== memberId)
            } : g
          ),
          selectedGroup: state.selectedGroup && state.selectedGroup._id === groupId ? {
            ...state.selectedGroup,
            members: (state.selectedGroup.members || []).filter(m => m.userId !== memberId)
          } : state.selectedGroup
        }));
      } else if (type === 'member-left' && groupId) {
        const memberId = data.memberId;
        set((state) => ({
          groups: state.groups.map(g =>
            g._id === groupId ? {
              ...g,
              members: (g.members || []).filter(m => m.userId !== memberId)
            } : g
          ),
          selectedGroup: state.selectedGroup && state.selectedGroup._id === groupId ? {
            ...state.selectedGroup,
            members: (state.selectedGroup.members || []).filter(m => m.userId !== memberId)
          } : state.selectedGroup
        }));
      }
    });

    // Listen for budget updates
    socketService.onBudgetUpdate((data) => {
      console.log('Real-time budget update:', data);
      const { type, budget } = data;

      if ((type === 'updated' || type === 'created') && budget) {
        set((state) => ({
          budgets: {
            ...state.budgets,
            ...budget
          }
        }));
      }
    });

    // Listen for split bill updates
    socketService.onSplitBillUpdate((data) => {
      console.log('Real-time split bill update:', data);
      const { type, splitBill } = data;

      if (type === 'created' && splitBill) {
        set((state) => ({
          splitBills: [...state.splitBills, splitBill]
        }));
      } else if (type === 'updated' && splitBill) {
        set((state) => ({
          splitBills: state.splitBills.map(bill =>
            bill._id === splitBill._id ? splitBill : bill
          )
        }));
      }
    });
  },
}));

export default useFinanceStore;