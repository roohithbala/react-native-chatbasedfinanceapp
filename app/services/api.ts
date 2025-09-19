import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API Configuration
export const API_BASE_URL = __DEV__
  ? 'http://10.63.153.172:3001/api'
  : 'https://your-production-api.com/api';

console.log('API Base URL:', API_BASE_URL);

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
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.message);
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
      console.log('Calling expenses API with params:', params);
      const response = await api.get('/expenses', { params });
      console.log('Expenses API raw response:', response);
      
      // More flexible validation - handle various response formats
      if (!response.data) {
        console.warn('No response data from expenses API');
        return {
          expenses: [],
          totalPages: 0,
          currentPage: 1,
          total: 0
        };
      }
      
      // Handle different response formats
      let expenses = [];
      let totalPages = 0;
      let currentPage = 1;
      let total = 0;
      
      if (Array.isArray(response.data)) {
        // Direct array response
        console.log('Handling direct array response format');
        expenses = response.data;
      } else if (response.data.expenses && Array.isArray(response.data.expenses)) {
        // Standard response format
        console.log('Handling standard response format with expenses property');
        expenses = response.data.expenses;
        totalPages = response.data.totalPages || 0;
        currentPage = response.data.currentPage || 1;
        total = response.data.total || 0;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        // Alternative response format
        console.log('Handling alternative response format with data property');
        expenses = response.data.data;
        totalPages = response.data.totalPages || 0;
        currentPage = response.data.currentPage || 1;
        total = response.data.total || 0;
      } else if (response.data.data && response.data.data.expenses && Array.isArray(response.data.data.expenses)) {
        // Nested response format
        console.log('Handling nested response format');
        expenses = response.data.data.expenses;
        totalPages = response.data.data.totalPages || response.data.totalPages || 0;
        currentPage = response.data.data.currentPage || response.data.currentPage || 1;
        total = response.data.data.total || response.data.total || 0;
      } else {
        console.warn('Unexpected expenses response format:', response.data);
        // Try to extract expenses from any nested structure
        const findExpenses = (obj: any): any[] => {
          if (Array.isArray(obj)) return obj;
          if (obj && typeof obj === 'object') {
            if (obj.expenses && Array.isArray(obj.expenses)) return obj.expenses;
            if (obj.data && Array.isArray(obj.data)) return obj.data;
            if (obj.data && obj.data.expenses && Array.isArray(obj.data.expenses)) return obj.data.expenses;
            // Recursively search
            for (const key in obj) {
              const result = findExpenses(obj[key]);
              if (result.length > 0) return result;
            }
          }
          return [];
        };
        
        expenses = findExpenses(response.data);
        console.log('Extracted expenses using fallback method:', expenses.length, 'items');
      }
      
      // Ensure expenses is always an array
      if (!Array.isArray(expenses)) {
        console.warn('Expenses is not an array, converting to empty array');
        expenses = [];
      }
      
      // Validate expense objects
      const validExpenses = expenses.filter(expense => {
        const isValid = expense && typeof expense === 'object' && expense._id;
        if (!isValid) {
          console.warn('Invalid expense object:', expense);
        }
        return isValid;
      });
      
      console.log(`Returning ${validExpenses.length} valid expenses out of ${expenses.length} total`);
      
      return {
        expenses: validExpenses,
        totalPages: totalPages,
        currentPage: currentPage,
        total: total
      };
    } catch (error: any) {
      console.error('Error fetching expenses:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      
      // Return empty data instead of throwing to prevent app crashes
      if (error.name === 'NetworkError' || !error.response) {
        console.warn('Network error fetching expenses, returning empty data');
        return {
          expenses: [],
          totalPages: 0,
          currentPage: 1,
          total: 0
        };
      }
      
      // For other errors, still return empty data but log the error
      console.error('Non-network error in expenses API, returning empty data:', error.message);
      return {
        expenses: [],
        totalPages: 0,
        currentPage: 1,
        total: 0
      };
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
      
      // More flexible validation - handle various response formats
      if (!response.data) {
        throw new Error('No response data from server');
      }
      
      // Check for success status and data
      if (response.data.status === 'success' && response.data.data) {
        return response.data.data;
      }
      
      // Handle alternative response formats
      if (response.data.group) {
        return { group: response.data.group };
      }
      
      // If we get here, the response format is unexpected
      console.warn('Unexpected add member response format:', response.data);
      throw new Error('Invalid response format from server');
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
      
      // More flexible validation for messages response
      if (!response.data) {
        throw new Error('No response data from server');
      }
      
      // Check if response has the expected structure
      if (response.data.status === 'success' && response.data.data) {
        const { messages, group } = response.data.data;
        
        // Validate messages array
        if (!Array.isArray(messages)) {
          console.warn('Messages is not an array:', messages);
          return {
            status: 'success',
            data: {
              messages: [],
              group: group || undefined
            }
          };
        }
        
        // Validate each message has required fields
        const validMessages = messages.filter(msg => 
          msg && 
          typeof msg === 'object' && 
          msg.text && 
          msg.user && 
          msg._id
        );
        
        if (validMessages.length !== messages.length) {
          console.warn(`Filtered ${messages.length - validMessages.length} invalid messages`);
        }
        
        return {
          status: 'success',
          data: {
            messages: validMessages,
            group: group || undefined
          }
        };
      }
      
      // Handle alternative response formats
      if (response.data.messages && Array.isArray(response.data.messages)) {
        return {
          status: 'success',
          data: {
            messages: response.data.messages,
            group: response.data.group || undefined
          }
        };
      }
      
      console.warn('Unexpected messages response format:', response.data);
      throw new Error('Invalid response format from server');
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
      if (!response.data) {
        console.warn('No response data from recent chats API');
        return [];
      }
      
      // Backend returns chats array directly
      const chats = response.data;
      if (!Array.isArray(chats)) {
        console.warn('Recent chats response is not an array:', chats);
        return [];
      }
      
      return chats;
    } catch (error) {
      console.error('Error fetching recent chats:', error);
      return [];
    }
  },

  getChatHistory: async (userId: string) => {
    try {
      const response = await api.get(`/direct-messages/${userId}`);
      if (!response.data) {
        console.warn('No response data from chat history API');
        return [];
      }
      
      // Backend returns messages array directly
      const messages = response.data;
      if (!Array.isArray(messages)) {
        console.warn('Chat history response is not an array:', messages);
        return [];
      }
      
      return messages;
    } catch (error) {
      console.error('Error fetching chat history:', error);
      return [];
    }
  },

  sendMessage: async (userId: string, text: string) => {
    try {
      const response = await api.post(`/direct-messages/${userId}`, { text });
      if (!response.data) {
        throw new Error('Invalid response format from server');
      }
      
      // Backend returns the message directly, not nested
      const message = response.data;
      if (!message || !message._id || !message.text) {
        throw new Error('Invalid response format from server');
      }
      
      return message;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  markAsRead: async (userId: string) => {
    try {
      const response = await api.put(`/direct-messages/${userId}/read`);
      if (!response.data) {
        console.warn('No response data from mark as read API');
        return { success: true };
      }
      return response.data;
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
  },
};

// Todo API
export const todosAPI = {
  getTodos: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    priority?: string;
    category?: string;
    tags?: string[];
    dueBefore?: string;
    dueAfter?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) => {
    try {
      const response = await api.get('/todos', { 
        params,
        timeout: 10000
      });
      
      // Handle various response formats
      if (!response.data) {
        return {
          todos: [],
          totalPages: 0,
          currentPage: 1,
          total: 0
        };
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Error fetching todos:', error);
      if (error.name === 'NetworkError' || !error.response) {
        return {
          todos: [],
          totalPages: 0,
          currentPage: 1,
          total: 0
        };
      }
      throw error;
    }
  },

  getOverdueTodos: async () => {
    try {
      const response = await api.get('/todos/overdue');
      return response.data.todos || [];
    } catch (error) {
      console.error('Error fetching overdue todos:', error);
      return [];
    }
  },

  getTodosDueSoon: async (days: number = 7) => {
    try {
      const response = await api.get('/todos/due-soon', { params: { days } });
      return response.data.todos || [];
    } catch (error) {
      console.error('Error fetching todos due soon:', error);
      return [];
    }
  },

  getTodo: async (id: string) => {
    try {
      const response = await api.get(`/todos/${id}`);
      if (!response.data || !response.data.todo) {
        throw new Error('Invalid response format from server');
      }
      return response.data.todo;
    } catch (error) {
      console.error('Error fetching todo:', error);
      throw error;
    }
  },

  createTodo: async (todoData: {
    title: string;
    description?: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    dueDate?: string;
    tags?: string[];
    category?: string;
    isRecurring?: boolean;
    recurringPattern?: {
      frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
      interval: number;
      endDate?: string;
    };
    location?: {
      address: string;
      coordinates: {
        latitude: number;
        longitude: number;
      };
    };
  }) => {
    try {
      const response = await api.post('/todos', todoData);
      if (!response.data || !response.data.todo) {
        throw new Error('Invalid response from server');
      }
      return response.data;
    } catch (error) {
      console.error('Error creating todo:', error);
      throw error;
    }
  },

  updateTodo: async (id: string, todoData: Partial<{
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'not-started' | 'in-progress' | 'completed' | 'cancelled';
    dueDate: string;
    tags: string[];
    category: string;
    isRecurring: boolean;
    recurringPattern: {
      frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
      interval: number;
      endDate?: string;
    };
    location: {
      address: string;
      coordinates: {
        latitude: number;
        longitude: number;
      };
    };
  }>) => {
    try {
      const response = await api.put(`/todos/${id}`, todoData);
      if (!response.data || !response.data.todo) {
        throw new Error('Invalid response from server');
      }
      return response.data;
    } catch (error) {
      console.error('Error updating todo:', error);
      throw error;
    }
  },

  deleteTodo: async (id: string) => {
    try {
      const response = await api.delete(`/todos/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting todo:', error);
      throw error;
    }
  },

  markCompleted: async (id: string) => {
    try {
      const response = await api.patch(`/todos/${id}/complete`);
      if (!response.data || !response.data.todo) {
        throw new Error('Invalid response from server');
      }
      return response.data;
    } catch (error) {
      console.error('Error marking todo as completed:', error);
      throw error;
    }
  },

  markInProgress: async (id: string) => {
    try {
      const response = await api.patch(`/todos/${id}/start`);
      if (!response.data || !response.data.todo) {
        throw new Error('Invalid response from server');
      }
      return response.data;
    } catch (error) {
      console.error('Error marking todo as in progress:', error);
      throw error;
    }
  },

  shareTodo: async (id: string, userId: string, permission: 'view' | 'edit' = 'view') => {
    try {
      const response = await api.post(`/todos/${id}/share`, { userId, permission });
      if (!response.data || !response.data.todo) {
        throw new Error('Invalid response from server');
      }
      return response.data;
    } catch (error) {
      console.error('Error sharing todo:', error);
      throw error;
    }
  },

  removeShare: async (id: string, userId: string) => {
    try {
      const response = await api.delete(`/todos/${id}/share/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error removing share:', error);
      throw error;
    }
  },

  getStats: async () => {
    try {
      const response = await api.get('/todos/stats/overview');
      return response.data.stats || {
        total: 0,
        completed: 0,
        inProgress: 0,
        pending: 0,
        overdue: 0
      };
    } catch (error) {
      console.error('Error fetching todo stats:', error);
      return {
        total: 0,
        completed: 0,
        inProgress: 0,
        pending: 0,
        overdue: 0
      };
    }
  },
};

// Test API
export const testAPI = {
  testConnection: async () => {
    try {
      console.log('Testing backend connection...');
      const response = await api.get('/test');
      console.log('Test response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Test connection failed:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      throw error;
    }
  },

  testHealth: async () => {
    try {
      console.log('Testing backend health...');
      const response = await api.get('/health');
      console.log('Health response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Health check failed:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      throw error;
    }
  }
};

export default api;