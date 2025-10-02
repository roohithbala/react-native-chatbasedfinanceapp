import { useState } from 'react';
import { useChatData } from '@/hooks/useChatData';
import { useChatActions } from '@/hooks/useChatActions';
import { useSearch } from '@/hooks/useSearch';
import { useMenuActions } from '@/hooks/useMenuActions';

export const useChatsLogic = () => {
  const [activeTab, setActiveTab] = useState<'chats' | 'groups'>('chats');

  const {
    recentChats,
    setRecentChats,
    groups,
    currentUser,
    isLoading,
    storeLoading,
    refreshing,
    handleRefresh,
    addNewChatToList,
  } = useChatData();

  const {
    showJoinGroup,
    setShowJoinGroup,
    inviteCode,
    setInviteCode,
    handleJoinGroup,
    handleUserSelect,
    handleGroupSelect,
    handleCreateGroup,
    handleAddMembers,
  } = useChatActions(addNewChatToList);

  const {
    searchQuery,
    searchResults,
    isSearching,
    handleSearch,
  } = useSearch(recentChats);

  const {
    showMenu,
    setShowMenu,
    selectedChat,
    menuPosition,
    mutedChats,
    blockedUsers,
    archivedChats,
    handleMenuPress,
    handleMenuOption,
  } = useMenuActions();

  return {
    // State
    activeTab,
    setActiveTab,
    showJoinGroup,
    setShowJoinGroup,
    inviteCode,
    setInviteCode,

    // Data
    recentChats,
    setRecentChats,
    groups,
    currentUser,
    isLoading,
    storeLoading,
    refreshing,
    searchQuery,
    searchResults,
    isSearching,
    showMenu,
    selectedChat,
    menuPosition,
    mutedChats,
    blockedUsers,
    archivedChats,

    // Handlers
    handleRefresh,
    handleSearch,
    handleJoinGroup,
    handleUserSelect,
    handleGroupSelect,
    handleCreateGroup,
    handleAddMembers,
    handleMenuPress,
    handleMenuOption,
    setShowMenu,
  };
};