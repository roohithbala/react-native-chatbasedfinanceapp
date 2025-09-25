import React from 'react';
import { ChatList } from '../components/ChatList';

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

interface Group {
  _id: string;
  name: string;
  description?: string;
  avatar: string;
  inviteCode: string;
  members: {
    userId: User;
    role: 'admin' | 'member';
    joinedAt?: string;
    isActive?: boolean;
  }[];
  budgets: {
    category: string;
    amount: number;
    period: string;
  }[];
}

interface User {
  _id: string;
  name: string;
  username: string;
  email: string;
  avatar: string;
  preferences?: {
    notifications: boolean;
    biometric: boolean;
    darkMode: boolean;
    currency: string;
  };
}

interface ChatsTabContentProps {
  activeTab: 'chats' | 'groups';
  recentChats: ChatPreview[];
  groups: Group[];
  currentUser: User | null;
  mutedChats: Set<string>;
  blockedUsers: Set<string>;
  archivedChats: Set<string>;
  refreshing: boolean;
  handleRefresh: () => void;
  handleUserSelect: (user: any) => void;
  handleGroupSelect: (group: any) => void;
  handleMenuPress: (chat: any, event: any) => void;
  handleAddMembers: (groupId: string, groupName: string) => void;
}

export const ChatsTabContent: React.FC<ChatsTabContentProps> = ({
  activeTab,
  recentChats,
  groups,
  currentUser,
  mutedChats,
  blockedUsers,
  archivedChats,
  refreshing,
  handleRefresh,
  handleUserSelect,
  handleGroupSelect,
  handleMenuPress,
  handleAddMembers,
}) => {
  if (activeTab === 'groups') {
    return (
      <ChatList
        data={groups || []}
        type="groups"
        currentUser={currentUser}
        mutedChats={mutedChats}
        blockedUsers={blockedUsers}
        archivedChats={archivedChats}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        onItemPress={handleGroupSelect}
        onItemLongPress={handleMenuPress}
        onAddMembers={handleAddMembers}
        emptyMessage="No groups found"
        emptySubMessage="Create or join a group to start sharing expenses"
      />
    );
  }

  return (
    <ChatList
      data={recentChats}
      type="direct"
      currentUser={currentUser}
      mutedChats={mutedChats}
      blockedUsers={blockedUsers}
      archivedChats={archivedChats}
      refreshing={refreshing}
      onRefresh={handleRefresh}
      onItemPress={handleUserSelect}
      onItemLongPress={handleMenuPress}
      emptyMessage="No recent chats"
      emptySubMessage="Search for users to start a conversation"
    />
  );
};