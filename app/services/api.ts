import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API Configuration
const API_BASE_URL = __DEV__ 
  ? 'http://10.1.60.70:3001/api' 
  : 'https://your-production-api.com/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // Increased timeout for slower connections
  headers: {
    'Content-Type': 'application/json',
  },
  // Add retry configuration
  validateStatus: (status) => status >= 200 && status < 500, // Don't reject if not 5xx
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Network errors or server unreachable
    if (error.code === 'ECONNABORTED' || !error.response) {
      console.error('Network error:', error.message);
      const customError = new Error('Network error: Please check your internet connection and try again');
      customError.name = 'NetworkError';
      return Promise.reject(customError);
    }

    // Handle specific status codes
    switch (error.response?.status) {
      case 401:
        // Token expired or invalid
        await AsyncStorage.removeItem('authToken');
        await AsyncStorage.removeItem('userData');
        error.message = 'Your session has expired. Please login again.';
        break;
      case 403:
        error.message = 'You do not have permission to perform this action.';
        break;
      case 404:
        error.message = 'The requested resource was not found.';
        break;
      case 500:
        error.message = 'An internal server error occurred. Please try again later.';
        break;
      default:
        if (!error.message) {
          error.message = 'An unexpected error occurred. Please try again.';
        }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: async (userData: { 
    name: string; 
    email: string; 
    username: string;
    password: string;
  }) => {
    try {
      const response = await api.post('/auth/register', userData);
      if (!response.data || !response.data.user || !response.data.token) {
        throw new Error('Invalid response format from server');
      }
      return response.data;
    } catch (error: any) {
      console.error('Registration error:', error);
      throw new Error(
        error.response?.data?.message ||
        error.message ||
        'Registration failed'
      );
    }
  },

  login: async (credentials: { email: string; password: string }) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/auth/logout', {});
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  updateProfile: async (profileData: {
    name?: string;
    email?: string;
    username?: string;
    avatar?: string;
    preferences?: {
      notifications?: boolean;
      biometric?: boolean;
      darkMode?: boolean;
      currency?: string;
    };
  }) => {
    try {
      const response = await api.put('/auth/profile', profileData);
      if (!response.data || !response.data.user) {
        throw new Error('Invalid response from server');
      }
      return response.data;
    } catch (error: any) {
      console.error('Error updating profile:', error);
      throw new Error(
        error.response?.data?.message ||
        error.message ||
        'Failed to update profile'
      );
    }
  },
};

// Split Bills API
export const splitBillsAPI = {
  getSplitBills: async (params?: any) => {
    try {
      const response = await api.get('/split-bills', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching split bills:', error);
      throw error;
    }
  },

  createSplitBill: async (billData: any) => {
    try {
      const response = await api.post('/split-bills', billData);
      return response.data;
    } catch (error) {
      console.error('Error creating split bill:', error);
      throw error;
    }
  },

  getSplitBill: async (id: string) => {
    try {
      const response = await api.get(`/split-bills/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching split bill:', error);
      throw error;
    }
  },

  markAsPaid: async (id: string) => {
    try {
      const response = await api.patch(`/split-bills/${id}/mark-paid`);
      return response.data;
    } catch (error) {
      console.error('Error marking split bill as paid:', error);
      throw error;
    }
  },

  getGroupSplitBills: async (groupId: string) => {
    try {
      const response = await api.get(`/split-bills/group/${groupId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching group split bills:', error);
      throw error;
    }
  },

  getUserSplitBills: async (userId: string) => {
    try {
      const response = await api.get(`/split-bills/user/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user split bills:', error);
      throw error;
    }
  }
};

// Expenses API
export const expensesAPI = {
  getExpenses: async (params?: any) => {
    try {
      const response = await api.get('/expenses', { 
        params,
        timeout: 10000, // 10 second timeout
      });
      
      // Validate response data - be more flexible with empty responses
      if (!response.data) {
        throw new Error('No response data from server');
      }
      
      // Ensure expenses is always an array
      const expenses = Array.isArray(response.data.expenses) 
        ? response.data.expenses 
        : [];
      
      return {
        ...response.data,
        expenses: expenses
      };
    } catch (error: any) {
      console.error('Error fetching expenses:', error);
      // Rethrow with better error message for network errors
      if (error.name === 'NetworkError' || !error.response) {
        throw new Error('Unable to fetch expenses. Please check your connection and try again.');
      }
      throw error;
    }
  },

  addExpense: async (expenseData: any) => {
    const response = await api.post('/expenses', expenseData);
    return response.data;
  },

  updateExpense: async (id: string, expenseData: any) => {
    const response = await api.put(`/expenses/${id}`, expenseData);
    return response.data;
  },

  deleteExpense: async (id: string) => {
    const response = await api.delete(`/expenses/${id}`);
    return response.data;
  },

  getStats: async (period?: string) => {
    const response = await api.get('/expenses/stats', { params: { period } });
    return response.data;
  },
};

// Groups API
export const groupsAPI = {
  getGroups: async () => {
    try {
      const response = await api.get('/groups');
      if (!response.data) {
        throw new Error('No response data from server');
      }
      
      // Handle various response formats
      const groups = response.data.groups || response.data.data?.groups || response.data;
      return {
        groups: Array.isArray(groups) ? groups : []
      };
    } catch (error) {
      console.error('Error fetching groups:', error);
      throw error;
    }
  },

  createGroup: async (groupData: any) => {
    try {
      const response = await api.post('/groups', groupData);
      if (!response.data || response.data.status !== 'success' || !response.data.data?.group) {
        throw new Error('Invalid response format from server');
      }
      return response.data.data;
    } catch (error) {
      console.error('Error creating group:', error);
      throw error;
    }
  },

  getGroup: async (id: string) => {
    try {
      const response = await api.get(`/groups/${id}`);
      if (!response.data || response.data.status !== 'success' || !response.data.data) {
        throw new Error('Invalid response format from server');
      }
      return response.data.data;
    } catch (error) {
      console.error('Get group error:', error);
      throw error;
    }
  },

  addMember: async (groupId: string, identifier: string, searchType: 'email' | 'username' = 'email') => {
    try {
      if (!identifier?.trim()) {
        throw new Error(`${searchType === 'email' ? 'Email' : 'Username'} is required`);
      }

      const requestBody = searchType === 'email' 
        ? { email: identifier.trim() }
        : { username: identifier.trim() };

      const response = await api.post(`/groups/${groupId}/members`, requestBody);
      
      if (!response.data || response.data.status !== 'success' || !response.data.data?.group) {
        throw new Error('Invalid response from server');
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Add member error:', error);
      throw error;
    }
  },

  splitBill: async (groupId: string, billData: any) => {
    try {
      const response = await api.post(`/groups/${groupId}/split`, billData);
      if (!response.data || response.data.status !== 'success' || !response.data.data) {
        throw new Error('Invalid response format from server');
      }
      return response.data.data;
    } catch (error) {
      console.error('Error splitting bill:', error);
      throw error;
    }
  },

  joinGroup: async (inviteCode: string) => {
    try {
      const response = await api.post(`/groups/join/${inviteCode}`);
      if (!response.data || response.data.status !== 'success' || !response.data.data?.group) {
        throw new Error('Invalid response format from server');
      }
      return response.data;
    } catch (error) {
      console.error('Join group error:', error);
      throw error;
    }
  },

  generateInviteCode: async (groupId: string) => {
    try {
      const response = await api.post(`/groups/${groupId}/invite-code`);
      if (!response.data || response.data.status !== 'success' || !response.data.data?.inviteCode) {
        throw new Error('Invalid response format from server');
      }
      return response.data.data;
    } catch (error) {
      console.error('Generate invite code error:', error);
      throw error;
    }
  },
};

// Chat API
import { ChatResponse, Message, MessageResponse, MessagesResponse } from '../types/chat';
import { isMessageResponse, isMessagesResponse } from '../utils/typeGuards';

export const chatAPI = {
  getMessages: async (groupId: string, params?: any): Promise<MessagesResponse> => {
    try {
      const response = await api.get(`/chat/${groupId}/messages`, { params });
      if (!isMessagesResponse(response.data)) {
        throw new Error('Invalid response format from server');
      }
      return response.data;
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  },

  sendMessage: async (groupId: string, messageData: {
    text: string;
    type?: Message['type'];
    status?: Message['status'];
    mediaUrl?: string;
    mediaType?: Message['mediaType'];
    mediaSize?: number;
  }): Promise<MessageResponse> => {
    try {
      const response = await api.post(`/chat/${groupId}/messages`, messageData);
      if (!isMessageResponse(response.data)) {
        throw new Error('Invalid response format from server');
      }
      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  markAsRead: async (groupId: string, messageIds: string[]): Promise<ChatResponse> => {
    try {
      const response = await api.put<ChatResponse>(`/chat/${groupId}/messages/read`, { messageIds });
      if (!response.data || response.data.status !== 'success') {
        throw new Error('Invalid response format from server');
      }
      return response.data;
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
  },

  addReaction: async (groupId: string, messageId: string, emoji: string): Promise<ChatResponse> => {
    try {
      const response = await api.post<ChatResponse>(
        `/chat/${groupId}/messages/${messageId}/reactions`,
        { emoji }
      );
      if (!response.data || response.data.status !== 'success') {
        throw new Error('Invalid response format from server');
      }
      return response.data;
    } catch (error) {
      console.error('Error adding reaction:', error);
      throw error;
    }
  }
};

// AI API
export const aiAPI = {
  getPredictions: async (userId?: string) => {
    const response = await api.get(`/ai/predict${userId ? `/${userId}` : ''}`);
    return response.data;
  },

  getEmotionalAnalysis: async (userId?: string) => {
    const response = await api.get(`/ai/emotions${userId ? `/${userId}` : ''}`);
    return response.data;
  },

  getSummary: async (period?: string) => {
    const response = await api.get(`/ai/summary${period ? `/${period}` : ''}`);
    return response.data;
  },
};

// Budgets API
export const budgetsAPI = {
  getBudgets: async (groupId?: string) => {
    try {
      const params = groupId ? { groupId } : {};
      const response = await api.get('/budgets', { 
        params,
        timeout: 10000 // 10 second timeout
      });
      
      // Validate response structure
      if (!response.data || !response.data.status || response.data.status !== 'success' || !response.data.data?.budgets) {
        throw new Error('Invalid budget data received from server');
      }
      
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching budgets:', error);
      
      // Enhance error messages for common issues
      if (error.name === 'NetworkError' || !error.response) {
        throw new Error('Unable to fetch budgets. Please check your connection and try again.');
      }
      
      // Rethrow the error with its enhanced message from the interceptor
      throw error;
    }
  },

  setBudget: async (budgetData: { category: string; amount: number; groupId?: string }) => {
    try {
      const response = await api.post('/budgets', budgetData);
      if (!response.data || !response.data.status || response.data.status !== 'success' || !response.data.data?.budgets) {
        throw new Error('Invalid response from server when setting budget');
      }
      return response.data.data;
    } catch (error) {
      console.error('Error setting budget:', error);
      throw error;
    }
  },

  deleteBudget: async (id: string) => {
    try {
      const response = await api.delete(`/budgets/${id}`);
      return response;
    } catch (error) {
      console.error('Error deleting budget:', error);
      throw error;
    }
  },

  getAlerts: async () => {
    try {
      const response = await api.get('/budgets/alerts');
      return response;
    } catch (error) {
      console.error('Error fetching budget alerts:', error);
      throw error;
    }
  },
};

// Users API
export const usersAPI = {
  searchUsers: async (query: string) => {
    try {
      const response = await api.get('/users/search', { params: { query } });
      
      // Handle various response formats
      let users = [];
      if (response.data) {
        if (Array.isArray(response.data)) {
          users = response.data;
        } else if (Array.isArray(response.data.users)) {
          users = response.data.users;
        } else if (response.data.data && Array.isArray(response.data.data.users)) {
          users = response.data.data.users;
        }
      }
      
      return users;
    } catch (error) {
      console.error('Error searching users:', error);
      return []; // Return empty array on error to prevent iterator issues
    }
  },

  getUser: async (id: string) => {
    try {
      const response = await api.get(`/users/${id}`);
      if (!response.data || !response.data.user) {
        throw new Error('Invalid response format from server');
      }
      return response.data.user;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  },

  searchByUsername: async (username: string) => {
    try {
      const response = await api.get('/users/search/username', { params: { username } });
      if (!response.data || !Array.isArray(response.data.users)) {
        throw new Error('Invalid response format from server');
      }
      return response.data.users;
    } catch (error) {
      console.error('Error searching by username:', error);
      return [];
    }
  },

  updatePreferences: async (preferences: any) => {
    const response = await api.put('/users/preferences', preferences);
    return response.data;
  },
};

// Direct Messages API
export const directMessagesAPI = {
  getRecentChats: async () => {
    try {
      const response = await api.get('/direct-messages/recent');
      return response.data;
    } catch (error) {
      console.error('Error fetching recent chats:', error);
      return [];
    }
  },

  getChatHistory: async (userId: string) => {
    try {
      const response = await api.get(`/direct-messages/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching chat history:', error);
      return [];
    }
  },

  sendMessage: async (userId: string, text: string) => {
    try {
      const response = await api.post(`/direct-messages/${userId}`, { text });
      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  markAsRead: async (userId: string) => {
    try {
      const response = await api.put(`/direct-messages/${userId}/read`);
      return response.data;
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
  },
};

export default api;