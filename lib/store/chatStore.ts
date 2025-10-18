import { create } from 'zustand';
import { chatAPI } from '../services/api';
import type { Message } from '@/app/types/chat';

interface ChatState {
  messages: { [groupId: string]: Message[] };
  isLoading: boolean;
  error: string | null;

  // Actions
  loadMessages: (groupId: string, isDirectChat?: boolean) => Promise<void>;
  sendMessage: (groupId: string, text: string, isDirectChat?: boolean, messageType?: string, splitBillData?: any) => Promise<void>;
  clearMessages: (groupId: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: {},
  isLoading: false,
  error: null,

  loadMessages: async (groupId: string, isDirectChat: boolean = false) => {
    try {
      set({ isLoading: true, error: null });

      console.log(`📥 Loading messages for ${isDirectChat ? 'direct chat' : 'group'}: ${groupId}`);

      let response;
      if (isDirectChat) {
        response = await chatAPI.getDirectMessages(groupId);
      } else {
        response = await chatAPI.getMessages(groupId);
      }

      if (response.status === 'success' && response.data?.messages) {
        const loadedMessages = response.data.messages;
        
        console.log('📨 Loaded messages:', {
          count: loadedMessages.length,
          preview: loadedMessages.slice(0, 3).map((m: any) => ({
            id: m._id,
            text: m.text?.substring(0, 30),
            senderId: m.sender?._id || m.sender,
            senderName: m.sender?.name || m.sender?.username,
            receiverId: m.receiver?._id || m.receiver,
            receiverName: m.receiver?.name || m.receiver?.username,
          }))
        });

        set((state) => ({
          messages: {
            ...state.messages,
            [groupId]: loadedMessages
          },
          isLoading: false
        }));
      }
    } catch (error: any) {
      console.error('❌ Failed to load messages:', error);
      set({
        error: error.response?.data?.message || error.message || 'Failed to load messages',
        isLoading: false
      });
      throw error;
    }
  },

  sendMessage: async (groupId: string, text: string, isDirectChat: boolean = false, messageType: string = 'text', splitBillData?: any) => {
    try {
      set({ isLoading: true, error: null });

      const messageData = {
        text,
        type: messageType,
        status: 'sent',
        ...(splitBillData && { splitBillData })
      };

      let response;
      if (isDirectChat) {
        response = await chatAPI.sendDirectMessage(groupId, messageData);
      } else {
        response = await chatAPI.sendMessage(groupId, messageData);
      }

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
  clearMessages: (groupId: string) => set((state) => ({
    messages: {
      ...state.messages,
      [groupId]: []
    }
  }))
}));

export default useChatStore;