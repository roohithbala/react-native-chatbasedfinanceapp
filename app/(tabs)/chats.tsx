import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import { useFinanceStore } from '@/lib/store/financeStore';
import { directMessagesAPI, usersAPI } from '@/app/services/api';

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

interface User {
  _id: string;
  name: string;
  username: string;
  avatar: string;
  email: string;
}

interface GroupChatPreview {
  _id: string;
  name: string;
  description?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
  members: Array<{
    _id: string;
    name: string;
    username: string;
  }>;
}

export default function ChatsScreen() {
  const [recentChats, setRecentChats] = useState<ChatPreview[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'groups' | 'direct'>('groups');
  
  // Group management states
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showJoinGroup, setShowJoinGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [inviteCode, setInviteCode] = useState('');

  const { 
    groups, 
    currentUser, 
    loadGroups, 
    createGroup, 
    joinGroupByCode,
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

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }

    try {
      await createGroup({
        name: groupName.trim(),
        description: groupDescription.trim()
      });
      setGroupName('');
      setGroupDescription('');
      setShowCreateGroup(false);
      Alert.alert('Success', 'Group created successfully!');
      await loadGroups(); // Refresh groups
    } catch (error) {
      // Error is handled in the store
    }
  };

  const handleJoinGroup = async () => {
    if (!inviteCode.trim()) {
      Alert.alert('Error', 'Please enter an invite code');
      return;
    }

    try {
      await joinGroupByCode(inviteCode.trim());
      setInviteCode('');
      setShowJoinGroup(false);
      await loadGroups(); // Refresh groups
    } catch (error) {
      // Error is handled in the store
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const results = await usersAPI.searchUsers(query);
      // Ensure results is always an array
      setSearchResults(Array.isArray(results) ? results : []);
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]); // Set empty array on error
    } finally {
      setIsSearching(false);
    }
  };

  const handleUserSelect = (userId: string) => {
    router.push(`/chat/${userId}`);
  };

  const handleGroupSelect = (group: any) => {
    // Navigate to group chat
    router.push({
      pathname: '/group-chat/[groupId]',
      params: { groupId: group._id, groupName: group.name }
    });
  };

  const renderUserItem = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={styles.chatItem}
      onPress={() => handleUserSelect(item._id)}
    >
      <View style={styles.avatarContainer}>
        {item.avatar ? (
          <Text style={styles.avatarText}>{item.avatar}</Text>
        ) : (
          <Text style={styles.avatarText}>
            {item.name.charAt(0).toUpperCase()}
          </Text>
        )}
      </View>
      <View style={styles.chatInfo}>
        <View style={styles.chatHeader}>
          <Text style={styles.chatName}>{item.name}</Text>
          <Ionicons name="chevron-forward" size={16} color="#64748B" />
        </View>
        <Text style={styles.userUsername}>@{item.username}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderGroupItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.chatItem}
      onPress={() => handleGroupSelect(item)}
    >
      <View style={[styles.avatarContainer, styles.groupAvatar]}>
        <Ionicons name="people" size={24} color="#FFFFFF" />
      </View>
      <View style={styles.chatInfo}>
        <View style={styles.chatHeader}>
          <Text style={styles.chatName}>{item.name}</Text>
          <Text style={styles.memberCount}>
            {item.members?.length || 0} members
          </Text>
        </View>
        <Text style={styles.groupDescription} numberOfLines={1}>
          {item.description || 'Group chat for shared expenses'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderDirectChatItem = ({ item }: { item: ChatPreview }) => (
    <TouchableOpacity
      style={styles.chatItem}
      onPress={() => handleUserSelect(item._id)}
    >
      <View style={styles.avatarContainer}>
        {item.user.avatar ? (
          <Text style={styles.avatarText}>{item.user.avatar}</Text>
        ) : (
          <Text style={styles.avatarText}>
            {item.user.name.charAt(0).toUpperCase()}
          </Text>
        )}
      </View>
      <View style={styles.chatInfo}>
        <View style={styles.chatHeader}>
          <Text style={styles.chatName}>{item.user.name}</Text>
          <Text style={styles.chatTime}>
            {format(new Date(item.lastMessageAt), 'MMM d')}
          </Text>
        </View>
        <View style={styles.chatPreview}>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.lastMessage}
          </Text>
          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadCount}>{item.unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderTabContent = () => {
    if (isSearching && searchQuery.trim()) {
      return (
        <FlatList
          data={searchResults}
          renderItem={renderUserItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="search" size={48} color="#CBD5E1" />
              <Text style={styles.emptyText}>No users found</Text>
              <Text style={styles.emptySubtext}>
                Try searching with a different name or username
              </Text>
            </View>
          }
        />
      );
    }

    if (activeTab === 'groups') {
      return (
        <FlatList
          data={groups || []}
          renderItem={renderGroupItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={48} color="#CBD5E1" />
              <Text style={styles.emptyText}>No groups found</Text>
              <Text style={styles.emptySubtext}>
                Create or join a group to start sharing expenses
              </Text>
            </View>
          }
        />
      );
    }

    return (
      <FlatList
        data={recentChats}
        renderItem={renderDirectChatItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubble-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyText}>No recent chats</Text>
            <Text style={styles.emptySubtext}>
              Search for users to start a conversation
            </Text>
          </View>
        }
      />
    );
  };

  if (!currentUser) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.errorText}>Please log in to access chats</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#2563EB', '#1D4ED8']} style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Chats</Text>
            <Text style={styles.headerSubtitle}>
              Stay connected with your groups and friends
            </Text>
          </View>
          {activeTab === 'groups' && (
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => setShowJoinGroup(true)}
              >
                <Ionicons name="add-circle" size={24} color="white" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => setShowCreateGroup(true)}
              >
                <Ionicons name="people" size={24} color="white" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </LinearGradient>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#64748B" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search users..."
          value={searchQuery}
          onChangeText={handleSearch}
          placeholderTextColor="#94A3B8"
        />
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'groups' && styles.activeTab]}
          onPress={() => setActiveTab('groups')}
        >
          <Ionicons 
            name="people" 
            size={20} 
            color={activeTab === 'groups' ? '#2563EB' : '#64748B'} 
          />
          <Text style={[
            styles.tabText, 
            activeTab === 'groups' && styles.activeTabText
          ]}>
            Groups
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'direct' && styles.activeTab]}
          onPress={() => setActiveTab('direct')}
        >
          <Ionicons 
            name="person" 
            size={20} 
            color={activeTab === 'direct' ? '#2563EB' : '#64748B'} 
          />
          <Text style={[
            styles.tabText, 
            activeTab === 'direct' && styles.activeTabText
          ]}>
            Direct
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Loading chats...</Text>
        </View>
      ) : (
        renderTabContent()
      )}

      {/* Create Group Modal */}
      <Modal
        visible={showCreateGroup}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCreateGroup(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New Group</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowCreateGroup(false);
                  setGroupName('');
                  setGroupDescription('');
                }}
              >
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={styles.modalInput}
              placeholder="Group Name"
              value={groupName}
              onChangeText={setGroupName}
              maxLength={50}
            />
            
            <TextInput
              style={[styles.modalInput, styles.modalTextArea]}
              placeholder="Description (optional)"
              value={groupDescription}
              onChangeText={setGroupDescription}
              multiline
              numberOfLines={3}
              maxLength={200}
              textAlignVertical="top"
            />
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowCreateGroup(false);
                  setGroupName('');
                  setGroupDescription('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.primaryButton]}
                onPress={handleCreateGroup}
                disabled={storeLoading}
              >
                <Text style={styles.primaryButtonText}>
                  {storeLoading ? 'Creating...' : 'Create'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Join Group Modal */}
      <Modal
        visible={showJoinGroup}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowJoinGroup(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Join Group</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowJoinGroup(false);
                  setInviteCode('');
                }}
              >
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={styles.modalInput}
              placeholder="Enter invite code"
              value={inviteCode}
              onChangeText={setInviteCode}
              autoCapitalize="characters"
              maxLength={8}
            />
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowJoinGroup(false);
                  setInviteCode('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.primaryButton]}
                onPress={handleJoinGroup}
                disabled={storeLoading}
              >
                <Text style={styles.primaryButtonText}>
                  {storeLoading ? 'Joining...' : 'Join'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 16,
    height: 48,
    backgroundColor: 'white',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    marginLeft: 6,
  },
  activeTabText: {
    color: '#2563EB',
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
  listContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 2,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  groupAvatar: {
    backgroundColor: '#2563EB',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  chatInfo: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
  },
  memberCount: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 8,
  },
  chatTime: {
    fontSize: 12,
    color: '#64748B',
  },
  groupDescription: {
    fontSize: 14,
    color: '#64748B',
  },
  userUsername: {
    fontSize: 14,
    color: '#64748B',
  },
  chatPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    flex: 1,
    fontSize: 14,
    color: '#64748B',
    marginRight: 8,
  },
  unreadBadge: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  unreadCount: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
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
    color: '#1E293B',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  modalTextArea: {
    height: 80,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F1F5F9',
  },
  cancelButtonText: {
    color: '#64748B',
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: '#2563EB',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
