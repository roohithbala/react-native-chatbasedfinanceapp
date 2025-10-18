import React from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet , RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ChatItem } from './ChatItem';
import { useTheme } from '../context/ThemeContext';

interface User {
  _id: string;
  name: string;
  username: string;
  avatar: string;
  email: string;
}

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
  members?: any[];
}

interface ChatListProps {
  data: (User | ChatPreview | Group)[];
  type: 'users' | 'groups' | 'direct';
  currentUser: any;
  mutedChats: Set<string>;
  blockedUsers: Set<string>;
  archivedChats: Set<string>;
  refreshing: boolean;
  onRefresh: () => void;
  onItemPress: (item: User | ChatPreview | Group) => void;
  onItemLongPress?: (item: Group | ChatPreview, event: any) => void;
  onAddMembers?: (groupId: string, groupName: string) => void;
  isSearching?: boolean;
  emptyMessage?: string;
  emptySubMessage?: string;
}

export const ChatList: React.FC<ChatListProps> = ({
  data,
  type,
  currentUser,
  mutedChats,
  blockedUsers,
  archivedChats,
  refreshing,
  onRefresh,
  onItemPress,
  onItemLongPress,
  onAddMembers,
  isSearching = false,
  emptyMessage,
  emptySubMessage,
}) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const getItemType = () => {
    switch (type) {
      case 'users': return 'user';
      case 'groups': return 'group';
      case 'direct': return 'direct';
      default: return 'user';
    }
  };

  const renderItem = ({ item }: { item: User | ChatPreview | Group }) => (
    <ChatItem
      item={item}
      type={getItemType()}
      currentUser={currentUser}
      mutedChats={mutedChats}
      blockedUsers={blockedUsers}
      archivedChats={archivedChats}
      onPress={() => onItemPress(item)}
      onLongPress={type === 'groups' || type === 'direct' ? (event) => onItemLongPress?.(item as Group | ChatPreview, event) : undefined}
      onAddMembers={onAddMembers}
    />
  );

  const renderEmpty = () => {
    if (isSearching) {
      return (
        <View style={styles.searchingContainer}>
          <ActivityIndicator size="small" color={theme.primary || '#2563EB'} />
          <Text style={styles.searchingText}>Searching...</Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Ionicons
          name={
            type === 'users' ? 'search' :
            type === 'groups' ? 'people-outline' :
            'chatbubble-outline'
          }
          size={48}
          color={theme.textSecondary || '#CBD5E1'}
        />
        <Text style={styles.emptyText}>
          {emptyMessage ||
            (type === 'users' ? 'No users found' :
             type === 'groups' ? 'No groups found' :
             'No recent chats')}
        </Text>
        <Text style={styles.emptySubtext}>
          {emptySubMessage ||
            (type === 'users' ? 'Try searching with a different name or username' :
             type === 'groups' ? 'Create or join a group to start sharing expenses' :
             'Search for users to start a conversation')}
        </Text>
      </View>
    );
  };

  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={(item) => item._id}
      contentContainerStyle={styles.listContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      ListHeaderComponent={
        isSearching ? (
          <View style={styles.searchingContainer}>
            <ActivityIndicator size="small" color={theme.primary || '#2563EB'} />
            <Text style={styles.searchingText}>Searching...</Text>
          </View>
        ) : null
      }
      ListEmptyComponent={renderEmpty}
    />
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  listContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text || '#1E293B',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.textSecondary || '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
  searchingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: theme.surfaceSecondary || '#F8FAFC',
  },
  searchingText: {
    marginLeft: 8,
    fontSize: 14,
    color: theme.textSecondary || '#64748B',
  },
});

export default ChatList;