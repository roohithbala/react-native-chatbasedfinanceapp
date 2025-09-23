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
  const [activeTab, setActiveTab] = useState<'groups' | 'direct'>('direct');

  const {
    groups,
    currentUser,
    loadGroups,
    isLoading: storeLoading
  } = useFinanceStore();

  useEffect(() => {
    if (activeTab === 'direct') {
      loadRecentChats();
    } else if (activeTab === 'groups') {
      loadGroups();
    }
  }, [activeTab]);

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
    if (activeTab === 'direct') {
      await loadRecentChats();
    } else if (activeTab === 'groups') {
      await loadGroups();
    }
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
    activeTab,
    setActiveTab,
    loadRecentChats,
    handleRefresh,
    loadGroups,
  };
};