import { create } from 'zustand';
import { chatAPI } from '../services/api';
import type { Message } from '@/app/types/chat';

interface ChatState {
  messages: { [groupId: string]: Message[] };
  isLoading: boolean;
  error: string | null;

  // Actions
  loadMessages: (groupId: string) => Promise<void>;
  sendMessage: (groupId: string, text: string) => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: {},
  isLoading: false,
  error: null,

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

  setLoading: (loading: boolean) => set({ isLoading: loading }),
  setError: (error: string | null) => set({ error }),
  clearError: () => set({ error: null }),
}));