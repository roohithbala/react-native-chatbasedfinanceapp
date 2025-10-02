import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { usersAPI } from '../../lib/services/api';

interface User {
  _id: string;
  name: string;
  username: string;
  avatar: string;
  email: string;
}

interface NewChatModalProps {
  visible: boolean;
  onClose: () => void;
  onUserSelect: (user: User) => void;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({
  visible,
  onClose,
  onUserSelect,
}) => {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!visible) {
      setSearchQuery('');
      setSearchResults([]);
      setIsSearching(false);
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    }
  }, [visible]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);

    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // If query is empty, clear results
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    // Debounce search - wait 300ms before searching
    const timeout = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await usersAPI.searchUsers(query);
        setSearchResults(Array.isArray(results) ? results : []);
      } catch (error) {
        console.error('Error searching users:', error);
        setSearchResults([]);
        Alert.alert('Search Error', 'Unable to search users. Please try again.');
      } finally {
        setIsSearching(false);
      }
    }, 300);

    setSearchTimeout(timeout);
  };

  const handleUserPress = (user: User) => {
    onUserSelect(user);
    onClose();
  };

  const renderUserItem = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={[styles.userItem, { backgroundColor: theme.surface }]}
      onPress={() => handleUserPress(item)}
    >
      <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
        <Text style={styles.avatarText}>
          {item.name.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.userInfo}>
        <Text style={[styles.userName, { color: theme.text }]}>
          {item.name}
        </Text>
        <Text style={[styles.userUsername, { color: theme.textSecondary }]}>
          @{item.username}
        </Text>
      </View>
      <Ionicons name="chatbubble-outline" size={20} color={theme.primary} />
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { backgroundColor: theme.surface }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            Start New Chat
          </Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.searchContainer}>
          <View style={[styles.searchInputContainer, { backgroundColor: theme.surface }]}>
            <Ionicons name="search" size={20} color={theme.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Search users by name or username..."
              placeholderTextColor={theme.textSecondary}
              value={searchQuery}
              onChangeText={handleSearch}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => handleSearch('')}>
                <Ionicons name="close-circle" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.content}>
          {isSearching ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.primary} />
              <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
                Searching users...
              </Text>
            </View>
          ) : searchQuery.trim() ? (
            searchResults.length > 0 ? (
              <FlatList
                data={searchResults}
                keyExtractor={(item) => item._id}
                renderItem={renderUserItem}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContainer}
              />
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="people-outline" size={48} color={theme.textSecondary} />
                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                  No users found
                </Text>
                <Text style={[styles.emptySubText, { color: theme.textSecondary }]}>
                  Try searching with a different name or username
                </Text>
              </View>
            )
          ) : (
            <View style={styles.initialContainer}>
              <Ionicons name="chatbubble-outline" size={48} color={theme.textSecondary} />
              <Text style={[styles.initialText, { color: theme.textSecondary }]}>
                Search for users to start a new conversation
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 32,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
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
  initialContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  initialText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 22,
  },
});

export default NewChatModal;