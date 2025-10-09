import { create } from 'zustand';
import { chatAPIService } from '../services/ChatAPIService';
import { socketService } from '../services/socketService';

interface Message {
  _id: string;
  text: string;
  sender: {
    _id: string;
    name: string;
    username: string;
    avatar?: string;
  };
  receiver?: {
    _id: string;
    name: string;
    username: string;
    avatar?: string;
  };
  splitBillData?: any;
  createdAt: string;
  read: boolean;
  type?: 'text' | 'image' | 'video' | 'audio' | 'document' | 'system' | 'command' | 'split_bill';
  status?: 'sent' | 'delivered' | 'read' | 'error';
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'audio' | 'document';
  mediaSize?: number;
  mediaDuration?: number;
  mediaWidth?: number;
  mediaHeight?: number;
  thumbnailUrl?: string;
  fileName?: string;
  mimeType?: string;
  mentions?: string[];
  reactions?: any[];
  isTemp?: boolean;
}

interface ChatState {
  messages: { [userId: string]: Message[] };
  isLoading: boolean;
  error: string | null;
  activeChatUserId: string | null;
  loadMessages: (userId: string, isDirectChat?: boolean) => Promise<void>;
  sendMessage: (userId: string, text: string, isDirectChat?: boolean, type?: string, splitBillData?: any) => Promise<void>;
  clearMessages: (userId: string) => void;
  markAsRead: (userId: string) => Promise<void>;
  clearChat: (userId: string) => Promise<void>;
  connectSocket: (userId: string) => Promise<void>;
  disconnectSocket: () => void;
  handleNewMessage: (message: Message) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: {},
  isLoading: false,
  error: null,
  activeChatUserId: null,

  loadMessages: async (userId: string, isDirectChat = false) => {
    set({ isLoading: true, error: null });
    try {
      console.log('📨 Loading messages for user:', userId);
      const messages = await chatAPIService.getChatHistory(userId);
      console.log(`📨 Loaded ${messages.length} messages`);
      
      // Log split bill messages with their data
      const splitBillMessages = messages.filter((m: any) => m.type === 'split_bill');
      console.log(`🎫 Found ${splitBillMessages.length} split bill messages`);
      splitBillMessages.forEach((msg: any) => {
        console.log('🎫 Split bill message:', {
          messageId: msg._id,
          splitBillId: msg.splitBillData?._id,
          description: msg.splitBillData?.description,
          participants: msg.splitBillData?.participants?.map((p: any) => ({
            userId: p.userId,
            isPaid: p.isPaid
          }))
        });
      });
      
      set(state => ({
        messages: {
          ...state.messages,
          [userId]: messages
        },
        isLoading: false
      }));
    } catch (error: any) {
      console.error('❌ Failed to load messages:', error);
      set({
        error: error.message || 'Failed to load messages',
        isLoading: false
      });
    }
  },

  sendMessage: async (userId: string, text: string, isDirectChat = false, type = 'text', splitBillData?: any) => {
    try {
      // Create a temporary message for immediate UI feedback
      const tempMessage: Message = {
        _id: `temp_${Date.now()}`,
        text,
        sender: { _id: 'current_user', name: 'You', username: 'you' }, // This will be replaced by the actual message
        createdAt: new Date().toISOString(),
        read: true,
        type: type as any,
        splitBillData,
        isTemp: true
      };

      // Add temporary message to UI
      set(state => ({
        messages: {
          ...state.messages,
          [userId]: [...(state.messages[userId] || []), tempMessage]
        }
      }));

      // Send message to backend
      const sentMessage = await chatAPIService.sendMessage(userId, {
        text,
        type,
        splitBillData
      });

      // Replace temporary message with actual message
      set(state => ({
        messages: {
          ...state.messages,
          [userId]: (state.messages[userId] || []).map(msg =>
            msg._id === tempMessage._id ? sentMessage : msg
          )
        }
      }));
    } catch (error: any) {
      // Remove temporary message on error
      set(state => ({
        messages: {
          ...state.messages,
          [userId]: (state.messages[userId] || []).filter(msg => !msg.isTemp)
        }
      }));
      throw error;
    }
  },

  clearMessages: (userId: string) => {
    set(state => ({
      messages: {
        ...state.messages,
        [userId]: []
      }
    }));
  },

  markAsRead: async (userId: string) => {
    try {
      await chatAPIService.markMessagesAsRead(userId);
      // Update local messages to mark as read
      set(state => ({
        messages: {
          ...state.messages,
          [userId]: (state.messages[userId] || []).map(msg => ({
            ...msg,
            read: true
          }))
        }
      }));
    } catch (error: any) {
      console.error('Failed to mark messages as read:', error);
    }
  },

  clearChat: async (userId: string) => {
    try {
      await chatAPIService.clearChat(userId);
      get().clearMessages(userId);
    } catch (error: any) {
      throw error;
    }
  },

  connectSocket: async (userId: string) => {
    try {
      await socketService.connect();
      socketService.joinUserRoom(userId);
      set({ activeChatUserId: userId });

      // Listen for new messages
      socketService.onNewMessage((message: Message) => {
        get().handleNewMessage(message);
      });
    } catch (error) {
      console.error('Failed to connect socket:', error);
    }
  },

  disconnectSocket: () => {
    socketService.offNewMessage();
    const { activeChatUserId } = get();
    if (activeChatUserId) {
      socketService.leaveUserRoom(activeChatUserId);
    }
    socketService.disconnect();
    set({ activeChatUserId: null });
  },

  handleNewMessage: (message: Message) => {
    set(state => {
      // Determine which chat this message belongs to
      const currentUserId = 'current_user'; // This should be replaced with actual current user ID
      const isFromMe = message.sender._id === currentUserId;
      const chatUserId = isFromMe ? (message.receiver?._id || '') : message.sender._id;

      if (!chatUserId) return state;

      const existingMessages = state.messages[chatUserId] || [];
      const messageExists = existingMessages.some(m => m._id === message._id);

      if (!messageExists) {
        return {
          messages: {
            ...state.messages,
            [chatUserId]: [...existingMessages, message]
          }
        };
      }

      return state;
    });
  }
}));