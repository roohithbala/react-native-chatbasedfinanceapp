import axios, { AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Chat API
import { ChatResponse, Message, MessageResponse, MessagesResponse } from '../../app/types/chat';
import { isMessageResponse, isMessagesResponse } from '../../app/utils/typeGuards';

// Import split API modules
import { API_BASE_URL, checkServerConnectivity, detectServerIP } from './apiConfig';
import api from './apiConfig';
import { authAPI } from './AuthAPI';
import { expensesAPI } from './ExpensesAPI';
import { groupsAPI } from './GroupsAPI';
import { chatAPIService as chatAPI } from './ChatAPIService';

// Re-export API_BASE_URL for backward compatibility
export { API_BASE_URL };

// Re-export checkServerConnectivity for backward compatibility
export { checkServerConnectivity };

// Auth API - imported from AuthAPI module
export { authAPI } from './AuthAPI';

// Split Bills API - keeping inline for now as it's smaller
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

// Expenses API - imported from ExpensesAPI module
export { expensesAPI } from './ExpensesAPI';

// Groups API - imported from GroupsAPI module
export { groupsAPI } from './GroupsAPI';

// Chat API - imported from ChatAPIService module
export { chatAPIService as chatAPI } from './ChatAPIService';

// AI API - keeping inline as it's small
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

// Budgets API - keeping inline as it's moderately sized
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

// Users API - keeping inline as it's small
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

// Direct Messages API - keeping inline as it's moderately sized
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

// Test API - keeping inline as it's small
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