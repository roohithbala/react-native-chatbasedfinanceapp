import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFinanceStore } from '@/lib/store/financeStore';
import { usersAPI } from '@/lib/services/api';
import SearchTypeSelector from './components/SearchTypeSelector';
import UserSearchInput from './components/UserSearchInput';
import SelectedUsersList from './components/SelectedUsersList';
import UserListItem from './components/UserListItem';

interface User {
  _id: string;
  name: string;
  username: string;
  email: string;
  avatar: string;
}

export default function AddMembersScreen() {
  const { groupId, groupName } = useLocalSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchType, setSearchType] = useState<'email' | 'username'>('username');
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);

  const { addMemberToGroup, isLoading, groups } = useFinanceStore();

  const currentGroup = groups?.find(g => g._id === groupId);

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      let results: User[] = [];

      if (searchType === 'username') {
        results = await usersAPI.searchByUsername(query);
      } else {
        // For email search, we'll use the general search API
        const searchResults = await usersAPI.searchUsers(query);
        results = searchResults.filter((user: User) =>
          user.email?.toLowerCase().includes(query.toLowerCase())
        );
      }

      // Filter out users who are already members of the group
      const filteredResults = results.filter(user =>
        !currentGroup?.members?.some(member =>
          (typeof member.userId === 'string' ? member.userId : member.userId._id) === user._id ||
          (typeof member.userId === 'string' ? false : member.userId.email === user.email)
        )
      );

      setSearchResults(filteredResults);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [searchType, currentGroup]);

  useEffect(() => {
    if (searchQuery.trim()) {
      handleSearch(searchQuery);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, searchType, handleSearch]);

  const toggleUserSelection = (user: User) => {
    setSelectedUsers(prev => {
      const isSelected = prev.some(u => u._id === user._id);
      if (isSelected) {
        return prev.filter(u => u._id !== user._id);
      } else {
        return [...prev, user];
      }
    });
  };

  const handleAddMembers = async () => {
    if (selectedUsers.length === 0) {
      Alert.alert('No Selection', 'Please select at least one user to add');
      return;
    }

    if (!groupId) {
      Alert.alert('Error', 'Group ID is missing');
      return;
    }

    // Validate that all selected users have email addresses
    const usersWithoutEmail = selectedUsers.filter(user => !user.email || !user.email.trim());
    if (usersWithoutEmail.length > 0) {
      Alert.alert(
        'Missing Information',
        `Cannot add ${usersWithoutEmail.map(u => u.name).join(', ')} - email address is required`
      );
      return;
    }

    try {
      let successCount = 0;
      let errorCount = 0;
      const failedUsers: string[] = [];

      for (const user of selectedUsers) {
        try {
          // Use email if available, otherwise fallback to username
          const identifier = user.email?.trim() || user.username;
          const searchType = user.email?.trim() ? 'email' : 'username';
          
          if (!identifier) {
            console.error(`User ${user.name} has no email or username`);
            failedUsers.push(user.name);
            errorCount++;
            continue;
          }
          
          await addMemberToGroup(groupId as string, identifier, searchType);
          successCount++;
        } catch (error: any) {
          errorCount++;
          failedUsers.push(user.name);
          console.error(`Failed to add ${user.name}:`, error.message || error);
        }
      }

      if (successCount > 0) {
        const message = errorCount > 0 
          ? `${successCount} member${successCount > 1 ? 's' : ''} added successfully.\nFailed to add: ${failedUsers.join(', ')}`
          : `${successCount} member${successCount > 1 ? 's' : ''} added successfully!`;
        
        Alert.alert(
          'Success',
          message,
          [
            {
              text: 'Done',
              onPress: () => router.back()
            }
          ]
        );
      } else {
        Alert.alert(
          'Error', 
          `Failed to add ${failedUsers.join(', ')}. Please try again.`
        );
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add members. Please try again.');
    }
  };

  if (!currentGroup) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Loading group...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#2563EB', '#1D4ED8']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Add Members</Text>
            <Text style={styles.headerSubtitle}>
              to {groupName || currentGroup.name}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.searchContainer}>
        <SearchTypeSelector
          searchType={searchType}
          onSearchTypeChange={setSearchType}
        />

        <UserSearchInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          searchType={searchType}
        />
      </View>

      <View style={styles.content}>
        <SelectedUsersList
          selectedUsers={selectedUsers}
          onRemoveUser={toggleUserSelection}
        />

        {isSearching ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={styles.loadingText}>Searching...</Text>
          </View>
        ) : searchQuery.trim() ? (
          <FlatList
            data={searchResults}
            renderItem={({ item }) => (
              <UserListItem
                user={item}
                isSelected={selectedUsers.some(u => u._id === item._id)}
                onToggleSelection={toggleUserSelection}
              />
            )}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.resultsList}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="search" size={48} color="#CBD5E1" />
                <Text style={styles.emptyText}>No users found</Text>
                <Text style={styles.emptySubtext}>
                  Try searching with a different {searchType}
                </Text>
              </View>
            }
          />
        ) : (
          <View style={styles.initialContainer}>
            <Ionicons name="people" size={64} color="#CBD5E1" />
            <Text style={styles.initialText}>Search for people to add</Text>
            <Text style={styles.initialSubtext}>
              Use their username or email address to find friends and family
            </Text>
          </View>
        )}
      </View>

      {selectedUsers.length > 0 && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.addButton, isLoading && styles.addButtonDisabled]}
            onPress={handleAddMembers}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="person-add" size={20} color="white" />
                <Text style={styles.addButtonText}>
                  Add {selectedUsers.length} Member{selectedUsers.length > 1 ? 's' : ''}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  searchTypeContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 4,
  },
  searchTypeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeSearchType: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchTypeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  activeSearchTypeText: {
    color: '#2563EB',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    height: 48,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
  },
  clearButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  selectedContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  selectedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  selectedUsers: {
    flexDirection: 'row',
  },
  selectedUserChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  selectedUserText: {
    fontSize: 14,
    color: '#2563EB',
    marginRight: 8,
  },
  removeUserButton: {
    padding: 2,
  },
  resultsList: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
  initialContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  initialText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  initialSubtext: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748B',
  },
  footer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
    elevation: 0,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});