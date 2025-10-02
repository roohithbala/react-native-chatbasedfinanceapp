import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

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

interface SearchResultsProps {
  searchResults: ChatPreview[];
  isSearching: boolean;
  onUserSelect: (user: any) => void;
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  searchResults,
  isSearching,
  onUserSelect,
}) => {
  const { theme } = useTheme();

  const renderUserItem = ({ item }: { item: ChatPreview }) => (
    <TouchableOpacity
      style={[styles.userItem, { backgroundColor: theme.surface }]}
      onPress={() => onUserSelect(item)}
    >
      <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
        <Text style={styles.avatarText}>
          {item.user.name.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.userInfo}>
        <Text style={[styles.userName, { color: theme.text }]}>
          {item.user.name}
        </Text>
        <Text style={[styles.userUsername, { color: theme.textSecondary }]}>
          {item.lastMessage || 'No messages yet'}
        </Text>
      </View>
      {item.unreadCount > 0 && (
        <View style={[styles.unreadBadge, { backgroundColor: theme.primary }]}>
          <Text style={styles.unreadText}>{item.unreadCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  if (isSearching) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="search" size={24} color={theme.textSecondary} />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
          Searching...
        </Text>
      </View>
    );
  }

  if (searchResults.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="people-outline" size={48} color={theme.textSecondary} />
        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
          No users found
        </Text>
        <Text style={[styles.emptySubText, { color: theme.textSecondary }]}>
          Try searching with a different name or username
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={searchResults}
      keyExtractor={(item) => item._id}
      renderItem={renderUserItem}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.listContainer}
    />
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  listContainer: {
    padding: 20,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  userUsername: {
    fontSize: 14,
  },
  unreadBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default SearchResults;