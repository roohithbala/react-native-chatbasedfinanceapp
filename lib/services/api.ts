import axios, { AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Chat API
import { ChatResponse, Message, MessageResponse, MessagesResponse } from '../../app/types/chat';
import { isMessageResponse, isMessagesResponse } from '../../app/utils/typeGuards';

// API Configuration
const getApiBaseUrl = () => {
  // For React Native development, localhost doesn't work from emulator/device
  // Try common development IPs or use environment variable
  const serverIP = process.env.EXPO_PUBLIC_SERVER_IP ||
                   '10.0.2.2' || // Android emulator localhost
                   '192.168.1.100' || // Common local network IP
                   'localhost';

  const serverPort = process.env.EXPO_PUBLIC_BACKEND_PORT || '3001';

  if (__DEV__) {
    return `http://${serverIP}:${serverPort}/api`;
  } else {
    return 'https://your-production-api.com/api';
  }
};export const API_BASE_URL = getApiBaseUrl();

console.log('API Base URL:', API_BASE_URL);
console.log('Server IP being used:', process.env.EXPO_PUBLIC_SERVER_IP || '10.0.2.2');
console.log('Server Port:', process.env.EXPO_PUBLIC_BACKEND_PORT || '3001');

// Network connectivity check
export const checkServerConnectivity = async (): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${API_BASE_URL.replace('/api', '')}/api/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.error('Server connectivity check failed:', error);
    return false;
  }
};

// Auto-detect server IP (useful for development)
export const detectServerIP = async (): Promise<string | null> => {
  const commonIPs = [
    '10.120.178.172', // Current configured IP
    '10.27.93.172', // Previous configured IP
    '10.42.112.172', // Previous configured IP
    '10.40.155.172', // Previous configured IP
    '192.168.1.100',
    '192.168.1.101',
    '192.168.1.102',
    '192.168.0.100',
    '192.168.0.101',
    '192.168.0.102',
    'localhost',
    '127.0.0.1'
  ];

  for (const ip of commonIPs) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const testUrl = `http://${ip}:3001/api/health`;
      const response = await fetch(testUrl, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        console.log('Server found at IP:', ip);
        return ip;
      }
    } catch (error) {
      // Continue to next IP
    }
  }

  console.log('No server found on common IPs');
  return null;
};

// Create axios instance
const api: ReturnType<typeof axios.create> = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // Increased timeout for slower connections
  headers: {
    'Content-Type': 'application/json',
  },
  // Add retry configuration
  validateStatus: (status: number) => status >= 200 && status < 500, // Don't reject if not 5xx
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
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
  (error: AxiosError) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log response for debugging
    console.log('API Response:', {
      status: response.status,
      url: response.config.url,
      dataType: typeof response.data,
      dataKeys: response.data ? Object.keys(response.data) : [],
      contentType: response.headers['content-type']
    });

    // Check if response is HTML instead of JSON
    if (response.headers['content-type']?.includes('text/html')) {
      console.error('Received HTML response instead of JSON:', response.data);
      throw new Error('Server returned HTML instead of JSON. Check server configuration.');
    }

    return response;
  },
  (error: AxiosError) => {
    console.error('API Error:', error.message);
    console.error('Error details:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      headers: error.response?.headers
    });

    // Handle rate limiting
    if (error.response?.status === 429) {
      console.warn('Rate limit exceeded. Retrying after delay...');
      // Could implement retry logic here
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

  login: async (credentials: { email?: string; username?: string; password: string }) => {
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

  googleAuth: async (idToken: string) => {
    try {
      const response = await api.post('/auth/google', { idToken });
      if (!response.data || !response.data.user || !response.data.token) {
        throw new Error('Invalid response from server');
      }
      return response.data;
    } catch (error: any) {
      console.error('Google auth error:', error);
      throw new Error(
        error.response?.data?.message ||
        error.message ||
        'Google authentication failed'
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
    } catch (error: any) {
      console.error('Error fetching split bills:', error);
      
      // Handle rate limiting
      if (error.response?.status === 429) {
        console.warn('Rate limit exceeded for split bills API');
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      
      throw error;
    }
  },

  createSplitBill: async (billData: any) => {
    try {
      const response = await api.post('/split-bills', billData);
      return response.data;
    } catch (error: any) {
      console.error('Error creating split bill:', error);
      
      // Handle rate limiting
      if (error.response?.status === 429) {
        console.warn('Rate limit exceeded for split bills API');
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      
      throw error;
    }
  },

  getSplitBill: async (id: string) => {
    try {
      const response = await api.get(`/split-bills/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching split bill:', error);
      
      // Handle rate limiting
      if (error.response?.status === 429) {
        console.warn('Rate limit exceeded for split bills API');
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      
      throw error;
    }
  },

  markAsPaid: async (id: string) => {
    try {
      const response = await api.patch(`/split-bills/${id}/mark-paid`);
      return response.data;
    } catch (error: any) {
      console.error('Error marking split bill as paid:', error);
      
      // Handle rate limiting
      if (error.response?.status === 429) {
        console.warn('Rate limit exceeded for split bills API');
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      
      throw error;
    }
  },

  getGroupSplitBills: async (groupId: string) => {
    try {
      const response = await api.get(`/split-bills/group/${groupId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching group split bills:', error);
      
      // Handle rate limiting
      if (error.response?.status === 429) {
        console.warn('Rate limit exceeded for split bills API');
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      
      throw error;
    }
  },

  getUserSplitBills: async (userId: string) => {
    try {
      const response = await api.get(`/split-bills/user/${userId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching user split bills:', error);
      
      // Handle rate limiting
      if (error.response?.status === 429) {
        console.warn('Rate limit exceeded for split bills API');
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      
      throw error;
    }
  }
};

// Expenses API
export const expensesAPI = {
  getExpenses: async (params?: any) => {
    try {
      console.log('🔍 Starting expenses API call...');
      console.log('Calling expenses API with params:', params);
      const response = await api.get('/expenses', { params });
      console.log('✅ Expenses API call completed');
      console.log('Expenses API raw response:', response);
      console.log('Response status:', response.status);
      console.log('Response data type:', typeof response.data);
      console.log('Response data keys:', response.data ? Object.keys(response.data) : []);
      console.log('Response headers:', response.headers);

      // Check if response.data is a string (HTML error page)
      if (typeof response.data === 'string') {
        console.error('Received string response instead of JSON object:', response.data.substring(0, 200));
        throw new Error('Server returned invalid response format');
      }

      // Simple validation - handle the standard backend response format
      if (!response.data) {
        console.warn('No response data from expenses API');
        return {
          expenses: [],
          totalPages: 0,
          currentPage: 1,
          total: 0
        };
      }

      // The backend returns: { status: 'success', data: { expenses: [...], totalPages: X, currentPage: X, total: X }, message: '...' }
      let expensesData;
      if (response.data && response.data.data && response.data.data.expenses) {
        // Backend response format: { status: 'success', data: { expenses: [...], ... }, message: '...' }
        expensesData = response.data.data;
        console.log('Using nested data format from backend');
      } else if (response.data && response.data.expenses) {
        // Alternative format: { expenses: [...], totalPages: X, ... }
        expensesData = response.data;
        console.log('Using direct data format from backend');
      } else if (response.data && response.data.status === 'success' && !response.data.data) {
        // Empty success response
        console.log('Received empty success response from backend');
        return {
          expenses: [],
          totalPages: 0,
          currentPage: 1,
          total: 0
        };
      } else {
        console.warn('Unexpected response format from expenses API:', response.data);
        console.warn('Response structure:', {
          hasData: !!response.data,
          dataKeys: response.data ? Object.keys(response.data) : [],
          dataType: typeof response.data,
          fullResponse: response
        });
        // Instead of returning empty data, let's try to extract expenses from any possible location
        const possibleExpenses = response.data?.data?.expenses || response.data?.expenses || [];
        if (Array.isArray(possibleExpenses)) {
          console.log('Found expenses in alternative location, using them');
          return {
            expenses: possibleExpenses,
            totalPages: response.data?.data?.totalPages || response.data?.totalPages || 0,
            currentPage: response.data?.data?.currentPage || response.data?.currentPage || 1,
            total: response.data?.data?.total || response.data?.total || 0
          };
        }
        return {
          expenses: [],
          totalPages: 0,
          currentPage: 1,
          total: 0
        };
      }

      const { expenses, totalPages, currentPage, total } = expensesData;

      // Ensure expenses is always an array
      const expensesArray = Array.isArray(expenses) ? expenses : [];
      
      console.log(`Processing ${expensesArray.length} expenses from API response`);
      console.log('Expenses data structure:', {
        expensesCount: expensesArray.length,
        totalPages: totalPages || 0,
        currentPage: currentPage || 1,
        total: total || 0,
        firstExpense: expensesArray[0] ? {
          id: expensesArray[0]._id,
          description: expensesArray[0].description,
          amount: expensesArray[0].amount
        } : null
      });

      // Basic validation - only check for required fields if we have data
      if (expensesArray.length > 0) {
        const validExpenses = expensesArray.filter(expense => {
          const hasId = expense && (expense._id || expense.id);
          const hasDescription = expense && expense.description;
          const hasAmount = expense && typeof expense.amount === 'number';

          if (!hasId) {
            console.warn('Expense missing ID:', expense);
          }
          if (!hasDescription) {
            console.warn('Expense missing description:', expense);
          }
          if (!hasAmount) {
            console.warn('Expense missing valid amount:', expense);
          }

          return hasId && hasDescription && hasAmount;
        });

        console.log(`Validated ${validExpenses.length} out of ${expensesArray.length} expenses`);

        return {
          expenses: validExpenses,
          totalPages: totalPages || 0,
          currentPage: currentPage || 1,
          total: total || 0
        };
      }

      console.log(`Returning ${expensesArray.length} expenses (no validation needed)`);

      return {
        expenses: expensesArray,
        totalPages: totalPages || 0,
        currentPage: currentPage || 1,
        total: total || 0
      };
    } catch (error: any) {
      console.error('Error fetching expenses:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        dataType: typeof error.response?.data,
        fullError: error
      });

      // Handle rate limiting specifically
      if (error.response?.status === 429) {
        console.warn('Rate limit exceeded for expenses API');
        return {
          expenses: [],
          totalPages: 0,
          currentPage: 1,
          total: 0,
          rateLimited: true
        };
      }

      // Handle authentication errors specifically
      if (error.response?.status === 401) {
        console.warn('Authentication error - user may need to log in again');
        // Don't throw, return empty data to prevent app crash
        return {
          expenses: [],
          totalPages: 0,
          currentPage: 1,
          total: 0,
          authError: true
        };
      }

      // Handle server errors (4xx, 5xx) by returning empty data instead of throwing
      if (error.response && error.response.status >= 400) {
        console.warn('Server error fetching expenses:', error.response.status, error.response.statusText);
        console.warn('Server response data:', error.response.data);
        return {
          expenses: [],
          totalPages: 0,
          currentPage: 1,
          total: 0,
          serverError: true,
          errorStatus: error.response.status
        };
      }

      // Handle network errors
      if (error.name === 'NetworkError' || !error.response) {
        console.warn('Network error fetching expenses, returning empty data');
        return {
          expenses: [],
          totalPages: 0,
          currentPage: 1,
          total: 0,
          networkError: true
        };
      }

      // For other errors, still return empty data but log the error
      console.error('Non-network error in expenses API, returning empty data:', error.message);
      return {
        expenses: [],
        totalPages: 0,
        currentPage: 1,
        total: 0,
        unknownError: true
      };
    }
  },

  addExpense: async (expenseData: any) => {
    const response = await api.post('/expenses', expenseData);
    
    // Handle backend response format: { message: '...', data: expense }
    if (response.data && response.data.data) {
      return response.data;
    }
    
    // Fallback for unexpected response format
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

  resetExpenses: async () => {
    try {
      const response = await api.delete('/expenses/reset');
      return response.data;
    } catch (error: any) {
      console.error('Error resetting expenses:', error);
      throw error;
    }
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
      
      // Handle various response formats - backend returns { status: 'success', data: { groups } }
      const groups = response.data.data?.groups || response.data.groups || response.data;
      return {
        groups: Array.isArray(groups) ? groups : []
      };
    } catch (error: any) {
      console.error('Error fetching groups:', error);
      
      // Handle rate limiting
      if (error.response?.status === 429) {
        console.warn('Rate limit exceeded for groups API');
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      
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
      
      // Handle error responses first
      if (response.data.status === 'error' || (response.data.message && response.data.status !== 'success')) {
        console.warn('Server returned error for add member:', response.data.message);
        throw new Error(response.data.message || 'Failed to add member');
      }
      
      // Check for success status and data
      if (response.data.status === 'success' && response.data.data) {
        // Backend returns: { status: 'success', data: { message: '...', group: {...} } }
        // Return the data object which contains both message and group
        return response.data.data;
      }
      
      // Handle alternative response formats
      if (response.data.group) {
        return { group: response.data.group };
      }
      
      // Handle direct group response
      if (response.data.status === 'success' && response.data.group) {
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

  getGroupStats: async (groupId: string) => {
    try {
      const response = await api.get(`/groups/${groupId}/stats`);
      if (!response.data || response.data.status !== 'success' || !response.data.data) {
        throw new Error('Invalid response format from server');
      }
      return response.data.data;
    } catch (error) {
      console.error('Get group stats error:', error);
      throw error;
    }
  },

  updateGroupInfo: async (groupId: string, groupData: any) => {
    try {
      console.log('Calling updateGroupInfo with:', { groupId, groupData });
      const response = await api.put(`/groups/${groupId}`, groupData);
      console.log('updateGroupInfo response:', response.data);
      console.log('Response status:', response.status);
      
      if (!response.data) {
        throw new Error('No response data from server');
      }
      
      if (response.data.status === 'success') {
        return response.data.data || response.data;
      }
      
      // Handle error responses
      if (response.data.status === 'error') {
        throw new Error(response.data.message || 'Server returned an error');
      }
      
      throw new Error(response.data.message || 'Invalid response format from server');
    } catch (error: any) {
      console.error('Update group info error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      throw error;
    }
  },

  updateGroupSettings: async (groupId: string, settings: any) => {
    try {
      console.log('Calling updateGroupSettings with:', { groupId, settings });
      console.log('Settings object type:', typeof settings);
      console.log('Settings keys:', Object.keys(settings || {}));

      const requestData = { settings };
      console.log('Request data being sent:', JSON.stringify(requestData, null, 2));

      // Get current user for debugging
      try {
        const currentUser = await authAPI.getCurrentUser();
        console.log('Current user from API:', currentUser);
      } catch (userError) {
        console.warn('Could not get current user for debugging:', userError);
      }

      const response = await api.put(`/groups/${groupId}/settings`, requestData);
      console.log('updateGroupSettings response:', response.data);
      console.log('Response status:', response.status);

      if (!response.data) {
        throw new Error('No response data from server');
      }

      if (response.data.status === 'success') {
        return response.data.data || response.data;
      }

      // Handle error responses
      if (response.data.status === 'error') {
        console.error('Server returned error status:', response.data.message);
        throw new Error(response.data.message || 'Server returned an error');
      }

      throw new Error(response.data.message || 'Invalid response format from server');
    } catch (error: any) {
      console.error('Update group settings error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);

      // Safely log error config if it exists
      if (error.config) {
        console.error('Error config:', error.config);
        console.error('Request URL:', error.config.url);
        console.error('Request method:', error.config.method);
        console.error('Request data:', error.config.data);
      } else {
        console.error('Error config: undefined (not an AxiosError)');
      }

      // Check if this is a network error or other non-Axios error
      if (!error.response) {
        console.error('Network or other error (no response object):', error.message);
        throw new Error('Network error or server unreachable. Please check your connection.');
      }

      throw error;
    }
  },

  updateNotificationSettings: async (groupId: string, notifications: any) => {
    try {
      console.log('Calling updateNotificationSettings with:', { groupId, notifications });
      const response = await api.put(`/groups/${groupId}/notifications`, { notifications });
      console.log('updateNotificationSettings response:', response.data);
      console.log('Response status:', response.status);
      
      if (!response.data) {
        throw new Error('No response data from server');
      }
      
      if (response.data.status === 'success') {
        return response.data.data || response.data;
      }
      
      // Handle error responses
      if (response.data.status === 'error') {
        throw new Error(response.data.message || 'Server returned an error');
      }
      
      throw new Error(response.data.message || 'Invalid response format from server');
    } catch (error: any) {
      console.error('Update notification settings error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      throw error;
    }
  },

  makeMemberAdmin: async (groupId: string, memberId: string) => {
    try {
      const response = await api.put(`/groups/${groupId}/members/${memberId}/role`, { role: 'admin' });
      if (!response.data || response.data.status !== 'success' || !response.data.data) {
        throw new Error('Invalid response format from server');
      }
      return response.data.data;
    } catch (error) {
      console.error('Make member admin error:', error);
      throw error;
    }
  },

  demoteMember: async (groupId: string, memberId: string) => {
    try {
      console.log('Attempting to demote member:', { groupId, memberId });
      const response = await api.put(`/groups/${groupId}/members/${memberId}/demote`);
      console.log('Demote member response:', response);
      console.log('Response data:', response.data);
      console.log('Response status:', response.status);

      // More flexible validation - handle various response formats
      if (!response.data) {
        console.error('No response data from demote member API');
        throw new Error('No response data from server');
      }

      // Check for success status
      if (response.data.status === 'success') {
        console.log('Member demoted successfully');
        // Return the data object which contains message and group
        return response.data.data || response.data;
      }

      // Handle error responses
      if (response.data.status === 'error') {
        console.error('Server returned error:', response.data.message);
        // Provide more user-friendly error messages
        let errorMessage = response.data.message || 'Server returned an error';
        if (errorMessage.includes('Cannot demote the last admin')) {
          errorMessage = 'Cannot demote the last admin. Promote another member to admin first.';
        }
        throw new Error(errorMessage);
      }

      // If we get here, the response format is unexpected
      console.warn('Unexpected demote member response format:', response.data);
      throw new Error('Invalid response format from server');
    } catch (error: any) {
      console.error('Demote member error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      throw error;
    }
  },

  removeMember: async (groupId: string, memberId: string) => {
    try {
      console.log('Attempting to remove member:', { groupId, memberId });
      const response = await api.delete(`/groups/${groupId}/members/${memberId}`);
      console.log('Remove member response:', response);
      console.log('Response data:', response.data);
      console.log('Response status:', response.status);

      // More flexible validation - handle various response formats
      if (!response.data) {
        console.error('No response data from remove member API');
        throw new Error('No response data from server');
      }

      // Check for success status
      if (response.data.status === 'success') {
        console.log('Member removed successfully');
        // Return the data object which contains message and group
        return response.data.data || response.data;
      }

      // Handle error responses
      if (response.data.status === 'error') {
        console.error('Server returned error:', response.data.message);
        // Provide more user-friendly error messages
        let errorMessage = response.data.message || 'Server returned an error';
        if (errorMessage.includes('Cannot remove admin members')) {
          errorMessage = 'Cannot remove admin members. Groups must have at least one admin. Make another member an admin first.';
        }
        throw new Error(errorMessage);
      }

      // If we get here, the response format is unexpected
      console.warn('Unexpected remove member response format:', response.data);
      throw new Error('Invalid response format from server');
    } catch (error: any) {
      console.error('Remove member error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      throw error;
    }
  },

  leaveGroup: async (groupId: string) => {
    try {
      const response = await api.delete(`/groups/${groupId}/leave`);
      if (!response.data || response.data.status !== 'success') {
        throw new Error('Invalid response format from server');
      }
      return response.data;
    } catch (error) {
      console.error('Leave group error:', error);
      throw error;
    }
  },

  updateGroup: async (groupId: string, groupData: any) => {
    try {
      console.log('Calling updateGroup with:', { groupId, groupData });
      const response = await api.put(`/groups/${groupId}`, groupData);
      console.log('updateGroup response:', response.data);
      console.log('Response status:', response.status);
      
      if (!response.data) {
        throw new Error('No response data from server');
      }
      
      if (response.data.status === 'success') {
        return response.data.data || response.data;
      }
      
      // Handle error responses
      if (response.data.status === 'error') {
        throw new Error(response.data.message || 'Server returned an error');
      }
      
      throw new Error(response.data.message || 'Invalid response format from server');
    } catch (error: any) {
      console.error('Update group error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      throw error;
    }
  },

  deleteGroup: async (groupId: string) => {
    try {
      console.log('Calling deleteGroup with:', { groupId });
      const response = await api.delete(`/groups/${groupId}`);
      console.log('deleteGroup response:', response.data);
      console.log('Response status:', response.status);
      
      if (!response.data) {
        throw new Error('No response data from server');
      }
      
      if (response.data.status === 'success') {
        return response.data.data || response.data;
      }
      
      // Handle error responses
      if (response.data.status === 'error') {
        throw new Error(response.data.message || 'Server returned an error');
      }
      
      throw new Error(response.data.message || 'Invalid response format from server');
    } catch (error: any) {
      console.error('Delete group error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      throw error;
    }
  },
};

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
  },

  // Multimedia upload functions
  uploadImage: async (groupId: string, imageFile: any, caption?: string): Promise<any> => {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      if (caption) {
        formData.append('caption', caption);
      }

      const response = await api.post(`/uploads/image/${groupId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.data || response.data.status !== 'success') {
        throw new Error('Invalid response format from server');
      }
      return response.data;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  },

  uploadVideo: async (groupId: string, videoFile: any, caption?: string): Promise<any> => {
    try {
      const formData = new FormData();
      formData.append('video', videoFile);
      if (caption) {
        formData.append('caption', caption);
      }

      const response = await api.post(`/uploads/video/${groupId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.data || response.data.status !== 'success') {
        throw new Error('Invalid response format from server');
      }
      return response.data;
    } catch (error) {
      console.error('Error uploading video:', error);
      throw error;
    }
  },

  uploadAudio: async (groupId: string, audioFile: any, caption?: string): Promise<any> => {
    try {
      const formData = new FormData();
      formData.append('audio', audioFile);
      if (caption) {
        formData.append('caption', caption);
      }

      const response = await api.post(`/uploads/audio/${groupId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.data || response.data.status !== 'success') {
        throw new Error('Invalid response format from server');
      }
      return response.data;
    } catch (error) {
      console.error('Error uploading audio:', error);
      throw error;
    }
  },

  uploadDocument: async (groupId: string, documentFile: any, caption?: string): Promise<any> => {
    try {
      const formData = new FormData();
      formData.append('document', documentFile);
      if (caption) {
        formData.append('caption', caption);
      }

      const response = await api.post(`/uploads/document/${groupId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.data || response.data.status !== 'success') {
        throw new Error('Invalid response format from server');
      }
      return response.data;
    } catch (error) {
      console.error('Error uploading document:', error);
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

      console.log('Budgets API response:', {
        status: response.status,
        dataType: typeof response.data,
        dataKeys: response.data ? Object.keys(response.data) : []
      });

      // Check if response.data is a string (HTML error page)
      if (typeof response.data === 'string') {
        console.error('Received string response for budgets API:', response.data.substring(0, 200));
        throw new Error('Server returned invalid response format for budgets');
      }

      // Validate response structure
      if (!response.data || !response.data.status || response.data.status !== 'success' || !response.data.data?.budgets) {
        console.error('Invalid budget response structure:', response.data);
        throw new Error('Invalid budget data received from server');
      }

      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching budgets:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.response?.status,
        dataType: typeof error.response?.data
      });

      // Handle rate limiting
      if (error.response?.status === 429) {
        console.warn('Rate limit exceeded for budgets API');
        throw new Error('Rate limit exceeded. Please try again later.');
      }

      // Enhance error messages for common issues
      if (error.name === 'NetworkError' || !error.response) {
        throw new Error('Unable to fetch budgets. Please check your connection and try again.');
      }

      // Rethrow the error with its enhanced message from the interceptor
      throw error;
    }
  },

  setBudget: async (budgetData: { category: string; amount: number }) => {
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

  getHistoricalBudgets: async (params: { period?: string; year?: number; month?: number }) => {
    try {
      const response = await api.get('/budgets/historical', { params });
      if (!response.data || !response.data.status || response.data.status !== 'success' || !response.data.data) {
        throw new Error('Invalid response from server when fetching historical budgets');
      }
      return response.data.data;
    } catch (error) {
      console.error('Error fetching historical budgets:', error);
      throw error;
    }
  },

  getBudgetTrends: async (params: { months?: number } = {}) => {
    try {
      const response = await api.get('/budgets/trends', { params });
      if (!response.data || !response.data.status || response.data.status !== 'success' || !response.data.data) {
        throw new Error('Invalid response from server when fetching budget trends');
      }
      return response.data.data;
    } catch (error) {
      console.error('Error fetching budget trends:', error);
      throw error;
    }
  },

  rolloverBudgets: async (params: { rolloverUnused?: boolean; rolloverPercentage?: number }) => {
    try {
      const response = await api.post('/budgets/rollover', params);
      if (!response.data || !response.data.status || response.data.status !== 'success') {
        throw new Error('Invalid response from server when rolling over budgets');
      }
      return response.data.data;
    } catch (error) {
      console.error('Error rolling over budgets:', error);
      throw error;
    }
  },

  resetBudgets: async (params: { period?: string; resetAmount?: number }) => {
    try {
      const response = await api.post('/budgets/reset', params);
      if (!response.data || !response.data.status || response.data.status !== 'success') {
        throw new Error('Invalid response from server when resetting budgets');
      }
      return response.data.data;
    } catch (error) {
      console.error('Error resetting budgets:', error);
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

  sendMessage: async (userId: string, text: string, splitBillData?: any) => {
    try {
      const payload: any = { text };
      if (splitBillData) {
        payload.splitBillData = splitBillData;
      }
      
      const response = await api.post(`/direct-messages/${userId}`, payload);
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

  clearChat: async (userId: string) => {
    try {
      const response = await api.delete(`/direct-messages/${userId}/clear`);
      if (!response.data) {
        throw new Error('Invalid response format from server');
      }
      return response.data;
    } catch (error) {
      console.error('Error clearing chat:', error);
      throw error;
    }
  },

  blockUser: async (userId: string) => {
    try {
      const response = await api.post(`/relationships/block/${userId}`);
      if (!response.data) {
        throw new Error('Invalid response format from server');
      }
      return response.data;
    } catch (error) {
      console.error('Error blocking user:', error);
      throw error;
    }
  },

  // Multimedia upload functions for direct messages
  uploadImage: async (userId: string, imageFile: any, caption?: string): Promise<any> => {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      if (caption) {
        formData.append('caption', caption);
      }
      formData.append('recipientId', userId);

      const response = await api.post(`/uploads/image/direct/${userId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.data || response.data.status !== 'success') {
        throw new Error('Invalid response format from server');
      }
      return response.data;
    } catch (error) {
      console.error('Error uploading image to direct message:', error);
      throw error;
    }
  },

  uploadVideo: async (userId: string, videoFile: any, caption?: string): Promise<any> => {
    try {
      const formData = new FormData();
      formData.append('video', videoFile);
      if (caption) {
        formData.append('caption', caption);
      }
      formData.append('recipientId', userId);

      const response = await api.post(`/uploads/video/direct/${userId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.data || response.data.status !== 'success') {
        throw new Error('Invalid response format from server');
      }
      return response.data;
    } catch (error) {
      console.error('Error uploading video to direct message:', error);
      throw error;
    }
  },

  uploadAudio: async (userId: string, audioFile: any, caption?: string): Promise<any> => {
    try {
      const formData = new FormData();
      formData.append('audio', audioFile);
      if (caption) {
        formData.append('caption', caption);
      }
      formData.append('recipientId', userId);

      const response = await api.post(`/uploads/audio/direct/${userId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.data || response.data.status !== 'success') {
        throw new Error('Invalid response format from server');
      }
      return response.data;
    } catch (error) {
      console.error('Error uploading audio to direct message:', error);
      throw error;
    }
  },

  uploadDocument: async (userId: string, documentFile: any, caption?: string): Promise<any> => {
    try {
      const formData = new FormData();
      formData.append('document', documentFile);
      if (caption) {
        formData.append('caption', caption);
      }
      formData.append('recipientId', userId);

      const response = await api.post(`/uploads/document/direct/${userId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.data || response.data.status !== 'success') {
        throw new Error('Invalid response format from server');
      }
      return response.data;
    } catch (error) {
      console.error('Error uploading document to direct message:', error);
      throw error;
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