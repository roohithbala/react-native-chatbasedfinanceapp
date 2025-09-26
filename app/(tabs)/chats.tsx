import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChatHeader } from '../components/ChatHeader';
import { SearchBar } from '../components/SearchBar';
import { ChatTabs } from '../components/ChatTabs';
import { ChatsTabContent } from '../components/ChatsTabContent';
import { JoinGroupModal } from '../components/JoinGroupModal';
import ChatMenu from '../components/ChatMenu';
import { useChatsLogic } from '@/hooks/useChatsLogic';
import { useTheme } from '../context/ThemeContext';

export default function ChatsScreen() {
  const { theme } = useTheme();
  const {
    activeTab,
    setActiveTab,
    showJoinGroup,
    setShowJoinGroup,
    inviteCode,
    setInviteCode,
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
  } = useChatsLogic();

  if (!currentUser) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.emptyContainer}>
          <Text style={[styles.errorText, { color: theme.error }]}>Please log in to access chats</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.headerContainer}>
        <ChatHeader
          activeTab={activeTab}
          onCreateGroup={handleCreateGroup}
          onJoinGroup={() => setShowJoinGroup(true)}
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
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading chats...</Text>
          </View>
        ) : searchQuery.trim() && activeTab === 'chats' ? (
          <ChatsTabContent
            activeTab="chats"
            recentChats={recentChats} // Use recentChats for now, we'll handle search separately
            groups={[]}
            currentUser={currentUser}
            mutedChats={mutedChats}
            blockedUsers={blockedUsers}
            archivedChats={archivedChats}
            refreshing={refreshing}
            handleRefresh={handleRefresh}
            handleUserSelect={handleUserSelect}
            handleGroupSelect={handleGroupSelect}
            handleMenuPress={handleMenuPress}
            handleAddMembers={handleAddMembers}
          />
        ) : (
          <ChatsTabContent
            activeTab={activeTab}
            recentChats={recentChats}
            groups={groups}
            currentUser={currentUser}
            mutedChats={mutedChats}
            blockedUsers={blockedUsers}
            archivedChats={archivedChats}
            refreshing={refreshing}
            handleRefresh={handleRefresh}
            handleUserSelect={handleUserSelect}
            handleGroupSelect={handleGroupSelect}
            handleMenuPress={handleMenuPress}
            handleAddMembers={handleAddMembers}
          />
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
    textAlign: 'center',
  },
});
