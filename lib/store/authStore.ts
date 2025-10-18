import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { authAPI } from '../services/api';
import socketService from '../services/socketService';
import type { User, Group } from './types';

interface AuthState {
  currentUser: User | null;
  isAuthenticated: boolean;
  authToken: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  clearStorage: () => Promise<void>;
  login: (credentials: { email?: string; username?: string; password: string }) => Promise<void>;
  register: (userData: { name: string; email: string; username: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  loadStoredAuth: () => Promise<void>;
  updateProfile: (userData: User) => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  currentUser: null,
  isAuthenticated: false,
  authToken: null,
  isLoading: false,
  error: null,

  clearStorage: async () => {
    try {
      await AsyncStorage.clear();
      set({
        currentUser: null,
        isAuthenticated: false,
        authToken: null,
        isLoading: false,
        error: null,
      });
      console.log('Storage cleared successfully');
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  },

  login: async (credentials: { email?: string; username?: string; password: string }) => {
    try {
      set({ isLoading: true, error: null });

      const response = await authAPI.login(credentials);

      if (response.token && response.user) {
        await AsyncStorage.setItem('authToken', response.token);
        await AsyncStorage.setItem('userData', JSON.stringify(response.user));

        set({
          isAuthenticated: true,
          authToken: response.token,
          currentUser: response.user,
          isLoading: false,
        });

        // Initialize socket listeners for real-time updates
        socketService.joinUserRoom(response.user._id);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || error.message || 'Login failed',
        isLoading: false,
      });
      throw error;
    }
  },

  updateProfile: async (userData: User) => {
    try {
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
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
          isLoading: false,
        });

        // Initialize socket listeners for real-time updates
        socketService.joinUserRoom(response.user._id);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || error.message || 'Registration failed',
        isLoading: false,
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
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.message || 'Logout failed',
        isLoading: false,
      });
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userData');
      set({
        isAuthenticated: false,
        authToken: null,
        currentUser: null,
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
        });

        console.log('Authentication restored, initializing socket listeners...');
        socketService.joinUserRoom(user._id);
      } else {
        set({
          currentUser: null,
          isAuthenticated: false,
          authToken: null,
        });
      }
    } catch (error) {
      console.error('Load stored auth error:', error);

      try {
        await AsyncStorage.clear();
        console.log('Cleared corrupted storage data');
      } catch (clearError) {
        console.error('Error clearing corrupted storage:', clearError);
      }

      set({
        currentUser: null,
        isAuthenticated: false,
        authToken: null,
      });
    }
  },

  setLoading: (loading: boolean) => set({ isLoading: loading }),
  setError: (error: string | null) => set({ error }),
  clearError: () => set({ error: null }),
}));

export default useAuthStore;