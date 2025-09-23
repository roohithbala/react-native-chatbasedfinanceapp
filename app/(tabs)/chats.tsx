import React from 'react';
import { SafeAreaView, View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { ChatHeader } from '../components/ChatHeader';
import { SearchBar } from '../components/SearchBar';
import { ChatTabs } from '../components/ChatTabs';
import { ChatList } from '../components/ChatList';
import { JoinGroupModal } from '../components/JoinGroupModal';
import { ChatMenu } from '../components/ChatMenu';
import { useChatData } from '@/hooks/useChatData';
import { useChatActions } from '@/hooks/useChatActions';
import { useSearch } from '@/hooks/useSearch';
import { useMenuActions } from '@/hooks/useMenuActions';

export default function ChatsScreen() {
  const {
    recentChats,
    setRecentChats,
    groups,
    currentUser,
    isLoading,
    storeLoading,
    refreshing,
    activeTab,
    setActiveTab,
    handleRefresh,
  } = useChatData();

  const {
    showJoinGroup,
    inviteCode,
    setInviteCode,
    handleJoinGroup,
    handleUserSelect,
    handleGroupSelect,
    handleCreateGroup,
    handleAddMembers,
  } = useChatActions();

  const {
    searchQuery,
    searchResults,
    isSearching,
    handleSearch,
  } = useSearch();

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

  const renderTabContent = () => {
    // Show search results if we have a search query (either searching or have results)
    if (searchQuery.trim() && activeTab === 'direct') {
      return (
        <ChatList
          data={searchResults}
          type="users"
          currentUser={currentUser}
          mutedChats={mutedChats}
          blockedUsers={blockedUsers}
          archivedChats={archivedChats}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          onItemPress={handleUserSelect}
          isSearching={isSearching}
          emptyMessage="No users found"
          emptySubMessage="Try searching with a different name or username"
        />
      );
    }

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
      <View style={styles.headerContainer}>
        <ChatHeader
          activeTab={activeTab}
          onCreateGroup={handleCreateGroup}
        />
      </View>

      <View style={styles.searchContainer}>
        <SearchBar
          value={searchQuery}
          onChangeText={handleSearch}
          placeholder="Search users..."
        />
      </View>

      <View style={styles.tabsContainer}>
        <ChatTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </View>

      <View style={styles.contentContainer}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={styles.loadingText}>Loading chats...</Text>
          </View>
        ) : (
          renderTabContent()
        )}
      </View>

      <JoinGroupModal
        visible={showJoinGroup}
        onClose={() => setInviteCode('')}
        inviteCode={inviteCode}
        onInviteCodeChange={setInviteCode}
        onJoin={handleJoinGroup}
        loading={storeLoading}
      />

      <ChatMenu
        visible={showMenu}
        onClose={() => setShowMenu(false)}
        position={menuPosition}
        activeTab={activeTab}
        selectedChat={selectedChat}
        mutedChats={mutedChats}
        blockedUsers={blockedUsers}
        archivedChats={archivedChats}
        onMenuOption={(option) => handleMenuOption(option, activeTab, setRecentChats)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerContainer: {
    // Header has its own styling
  },
  searchContainer: {
    // Search bar has its own styling
  },
  tabsContainer: {
    // Tabs have their own styling
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
  contentContainer: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
  },
});
