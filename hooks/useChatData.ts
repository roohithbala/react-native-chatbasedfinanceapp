import { useState, useEffect } from 'react';
import { useFinanceStore } from '../lib/store/financeStore';
import { directMessagesAPI } from '../lib/services/api';
import { socketService } from '../app/lib/services/socketService';

interface ChatPreview {
  _id: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  user: {
    name: string;
    username: string;
    avatar: string;
  };
}

export const useChatData = () => {
  const [recentChats, setRecentChats] = useState<ChatPreview[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const {
    groups,
    currentUser,
    loadGroups,
    isLoading: storeLoading
  } = useFinanceStore();

  useEffect(() => {
    loadRecentChats();
    loadGroups(); // Always load groups since they're shown in the chats tab

    // Listen for messages being read to update unread counts
    const setupSocketListeners = async () => {
      await socketService.connect();
      
      socketService.onMessagesRead((data) => {
        console.log('📬 Messages read event received, refreshing chats list');
        loadRecentChats(); // Refresh to get updated unread counts
      });

      // Also listen for new messages to update chat list
      socketService.onNewMessage((message) => {
        console.log('📬 New message received, refreshing chats list');
        loadRecentChats();
      });
    };

    setupSocketListeners();

    return () => {
      socketService.offMessagesRead();
    };
  }, [loadGroups]);

  const loadRecentChats = async () => {
    try {
      setIsLoading(true);
      const chats = await directMessagesAPI.getRecentChats();
      setRecentChats(chats);
    } catch (error) {
      console.error('Error loading recent chats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadRecentChats(), loadGroups()]);
    setRefreshing(false);
  };

  const addNewChatToList = (user: any) => {
    // Check if chat already exists
    const existingChatIndex = recentChats.findIndex(chat => chat._id === user._id);
    
    if (existingChatIndex !== -1) {
      // Move existing chat to top
      const existingChat = recentChats[existingChatIndex];
      const updatedChats = [
        existingChat,
        ...recentChats.slice(0, existingChatIndex),
        ...recentChats.slice(existingChatIndex + 1)
      ];
      setRecentChats(updatedChats);
    } else {
      // Add new chat at the top
      const newChat: ChatPreview = {
        _id: user._id,
        lastMessage: '',
        lastMessageAt: new Date().toISOString(),
        unreadCount: 0,
        user: {
          name: user.name,
          username: user.username,
          avatar: user.avatar || ''
        }
      };
      setRecentChats([newChat, ...recentChats]);
    }
  };

  return {
    recentChats,
    setRecentChats,
    groups,
    currentUser,
    isLoading,
    storeLoading,
    refreshing,
    loadRecentChats,
    handleRefresh,
    loadGroups,
    addNewChatToList,
  };
};