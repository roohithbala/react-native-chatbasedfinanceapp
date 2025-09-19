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
  Dimensions,
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

export default function ChatsScreen() {
  const [recentChats, setRecentChats] = useState<ChatPreview[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'groups' | 'direct'>('groups');
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  
  // Group management states
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showJoinGroup, setShowJoinGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [inviteCode, setInviteCode] = useState('');

  // Three-dot menu states
  const [showMenu, setShowMenu] = useState(false);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [mutedChats, setMutedChats] = useState<Set<string>>(new Set());
  const [blockedUsers, setBlockedUsers] = useState<Set<string>>(new Set());
  const [archivedChats, setArchivedChats] = useState<Set<string>>(new Set());

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

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
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

    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // If query is empty, clear results and show recent chats
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      if (activeTab === 'direct') {
        await loadRecentChats();
      }
      return;
    }

    // Debounce search - wait 300ms before searching
    const timeout = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await usersAPI.searchUsers(query);
        // Ensure results is always an array
        setSearchResults(Array.isArray(results) ? results : []);
      } catch (error) {
        console.error('Error searching users:', error);
        setSearchResults([]); // Set empty array on error
        Alert.alert('Search Error', 'Unable to search users. Please try again.');
      } finally {
        setIsSearching(false);
      }
    }, 300);

    setSearchTimeout(timeout);
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

  // Three-dot menu handlers
  const handleMenuPress = (chat: any, event: any) => {
    setSelectedChat(chat);
    setMenuPosition({ x: event.nativeEvent.pageX, y: event.nativeEvent.pageY });
    setShowMenu(true);
  };

  const handleMenuOption = (option: string) => {
    if (!selectedChat) return;

    switch (option) {
      case 'mute':
        const newMuted = new Set(mutedChats);
        if (newMuted.has(selectedChat._id)) {
          newMuted.delete(selectedChat._id);
        } else {
          newMuted.add(selectedChat._id);
        }
        setMutedChats(newMuted);
        Alert.alert('Success', `Chat ${newMuted.has(selectedChat._id) ? 'muted' : 'unmuted'}`);
        break;

      case 'block':
        const newBlocked = new Set(blockedUsers);
        if (newBlocked.has(selectedChat._id)) {
          newBlocked.delete(selectedChat._id);
        } else {
          newBlocked.add(selectedChat._id);
        }
        setBlockedUsers(newBlocked);
        Alert.alert('Success', `User ${newBlocked.has(selectedChat._id) ? 'blocked' : 'unblocked'}`);
        break;

      case 'archive':
        const newArchived = new Set(archivedChats);
        if (newArchived.has(selectedChat._id)) {
          newArchived.delete(selectedChat._id);
        } else {
          newArchived.add(selectedChat._id);
        }
        setArchivedChats(newArchived);
        Alert.alert('Success', `Chat ${newArchived.has(selectedChat._id) ? 'archived' : 'unarchived'}`);
        break;

      case 'delete':
        Alert.alert(
          'Delete Conversation',
          'Are you sure you want to delete this conversation? This action cannot be undone.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: () => {
                // Remove from recent chats or groups
                if (activeTab === 'direct') {
                  setRecentChats(prev => prev.filter(chat => chat._id !== selectedChat._id));
                } else {
                  // For groups, you might want to leave the group instead
                  Alert.alert('Info', 'To delete a group conversation, you need to leave the group first.');
                }
                Alert.alert('Success', 'Conversation deleted');
              }
            }
          ]
        );
        break;

      case 'clear':
        Alert.alert(
          'Clear Chat History',
          'Are you sure you want to clear all messages in this conversation?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Clear',
              style: 'destructive',
              onPress: () => {
                Alert.alert('Success', 'Chat history cleared');
              }
            }
          ]
        );
        break;

      case 'report':
        Alert.alert(
          'Report User',
          'Are you sure you want to report this user?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Report',
              style: 'destructive',
              onPress: () => {
                Alert.alert('Success', 'User reported. Our team will review this report.');
              }
            }
          ]
        );
        break;

      case 'splitBill':
        router.push({
          pathname: '/split-bill',
          params: {
            chatId: selectedChat._id,
            chatType: activeTab,
            participantName: selectedChat.user?.name || selectedChat.name
          }
        });
        break;

      case 'viewProfile':
        if (activeTab === 'direct') {
          router.push(`/profile/${selectedChat._id}`);
        } else {
          router.push(`/group-info/${selectedChat._id}`);
        }
        break;
    }

    setShowMenu(false);
    setSelectedChat(null);
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

  const renderGroupItem = ({ item }: { item: any }) => {
    const isAdmin = item.members?.some((member: any) => 
      member.userId === currentUser?._id && member.role === 'admin'
    );
    const isMuted = mutedChats.has(item._id);
    const isArchived = archivedChats.has(item._id);

    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() => handleGroupSelect(item)}
        onLongPress={(event) => handleMenuPress(item, event)}
      >
        <View style={[styles.avatarContainer, styles.groupAvatar]}>
          <Ionicons name="people" size={24} color="#FFFFFF" />
        </View>
        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <Text style={styles.chatName}>{item.name}</Text>
            <View style={styles.chatActions}>
              {isMuted && <Ionicons name="volume-mute" size={16} color="#64748B" style={styles.statusIcon} />}
              {isArchived && <Ionicons name="archive" size={16} color="#64748B" style={styles.statusIcon} />}
              <TouchableOpacity
                style={styles.menuButton}
                onPress={(event) => {
                  event.stopPropagation();
                  handleMenuPress(item, event);
                }}
              >
                <Ionicons name="ellipsis-vertical" size={16} color="#64748B" />
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.groupDescription} numberOfLines={1}>
            {item.description || 'Group chat for shared expenses'}
          </Text>
          <View style={styles.chatMeta}>
            <Text style={styles.memberCount}>
              {item.members?.length || 0} members
            </Text>
            {isAdmin && (
              <TouchableOpacity
                style={styles.addMemberButton}
                onPress={() => router.push({
                  pathname: '/add-members',
                  params: { 
                    groupId: item._id,
                    groupName: item.name 
                  }
                })}
              >
                <Ionicons name="person-add" size={16} color="#2563EB" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderDirectChatItem = ({ item }: { item: ChatPreview }) => {
    const isMuted = mutedChats.has(item._id);
    const isBlocked = blockedUsers.has(item._id);
    const isArchived = archivedChats.has(item._id);

    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() => handleUserSelect(item._id)}
        onLongPress={(event) => handleMenuPress(item, event)}
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
            <View style={styles.chatActions}>
              {isMuted && <Ionicons name="volume-mute" size={16} color="#64748B" style={styles.statusIcon} />}
              {isBlocked && <Ionicons name="ban" size={16} color="#EF4444" style={styles.statusIcon} />}
              {isArchived && <Ionicons name="archive" size={16} color="#64748B" style={styles.statusIcon} />}
              <TouchableOpacity
                style={styles.menuButton}
                onPress={(event) => {
                  event.stopPropagation();
                  handleMenuPress(item, event);
                }}
              >
                <Ionicons name="ellipsis-vertical" size={16} color="#64748B" />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.chatPreview}>
            <Text style={styles.lastMessage} numberOfLines={1}>
              {item.lastMessage}
            </Text>
            <View style={styles.chatMeta}>
              <Text style={styles.chatTime}>
                {format(new Date(item.lastMessageAt), 'MMM d')}
              </Text>
              {item.unreadCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadCount}>{item.unreadCount}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderTabContent = () => {
    // Show search results if we have a search query (either searching or have results)
    if (searchQuery.trim() && activeTab === 'direct') {
      return (
        <FlatList
          data={searchResults}
          renderItem={renderUserItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListHeaderComponent={
            isSearching ? (
              <View style={styles.searchingContainer}>
                <ActivityIndicator size="small" color="#2563EB" />
                <Text style={styles.searchingText}>Searching...</Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            !isSearching ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="search" size={48} color="#CBD5E1" />
                <Text style={styles.emptyText}>No users found</Text>
                <Text style={styles.emptySubtext}>
                  Try searching with a different name or username
                </Text>
              </View>
            ) : null
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
                onPress={() => router.push('/create-group')}
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

      {/* Three-dot Menu Modal */}
      <Modal
        visible={showMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        >
          <View style={[styles.menuContent, { top: menuPosition.y, left: menuPosition.x }]}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleMenuOption('viewProfile')}
            >
              <Ionicons name="person" size={20} color="#374151" />
              <Text style={styles.menuItemText}>
                {activeTab === 'direct' ? 'View Profile' : 'Group Info'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleMenuOption('splitBill')}
            >
              <Ionicons name="receipt" size={20} color="#374151" />
              <Text style={styles.menuItemText}>Split Bill</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleMenuOption('mute')}
            >
              <Ionicons name="volume-mute" size={20} color="#374151" />
              <Text style={styles.menuItemText}>
                {mutedChats.has(selectedChat?._id) ? 'Unmute' : 'Mute'}
              </Text>
            </TouchableOpacity>

            {activeTab === 'direct' && (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleMenuOption('block')}
              >
                <Ionicons name="ban" size={20} color="#EF4444" />
                <Text style={[styles.menuItemText, styles.dangerText]}>
                  {blockedUsers.has(selectedChat?._id) ? 'Unblock' : 'Block'}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleMenuOption('archive')}
            >
              <Ionicons name="archive" size={20} color="#374151" />
              <Text style={styles.menuItemText}>
                {archivedChats.has(selectedChat?._id) ? 'Unarchive' : 'Archive'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleMenuOption('clear')}
            >
              <Ionicons name="trash" size={20} color="#F59E0B" />
              <Text style={[styles.menuItemText, styles.warningText]}>Clear Chat</Text>
            </TouchableOpacity>

            {activeTab === 'direct' && (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleMenuOption('report')}
              >
                <Ionicons name="flag" size={20} color="#EF4444" />
                <Text style={[styles.menuItemText, styles.dangerText]}>Report</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleMenuOption('delete')}
            >
              <Ionicons name="trash" size={20} color="#EF4444" />
              <Text style={[styles.menuItemText, styles.dangerText]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
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
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginHorizontal: 2,
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
  chatActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusIcon: {
    marginRight: 4,
  },
  menuButton: {
    padding: 4,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
  },
  chatMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  memberCount: {
    fontSize: 12,
    color: '#64748B',
    marginRight: 8,
  },
  groupActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addMemberButton: {
    marginLeft: 8,
    padding: 6,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
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
  // Menu styles
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  menuContent: {
    position: 'absolute',
    backgroundColor: 'white',
    borderRadius: 8,
    paddingVertical: 8,
    minWidth: 180,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  menuItemText: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
  },
  dangerText: {
    color: '#EF4444',
  },
  warningText: {
    color: '#F59E0B',
  },
  searchingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
  },
  searchingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#64748B',
  },
});
