import { useState, useEffect } from 'react';
import { useFinanceStore } from '../lib/store/financeStore';
import { directMessagesAPI } from '../lib/services/api';

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
  }, []);

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
  };
};