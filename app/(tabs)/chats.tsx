import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ChatsHeaderWrapper from '../components/ChatsHeaderWrapper';
import ChatsSearch from '../components/ChatsSearch';
import ChatsContentWrapper from '../components/ChatsContentWrapper';
import { ChatTabs } from '../components/ChatTabs';
import { JoinGroupModal } from '../components/JoinGroupModal';
import { NewChatModal } from '../components/NewChatModal';
import ChatMenu from '../components/ChatMenu';
import { useChatsLogic } from '@/hooks/useChatsLogic';
import { useTheme } from '../context/ThemeContext';
import styles from '@/lib/styles/chatsStyles';

export default function ChatsScreen() {
  const { theme } = useTheme();
  const [showNewChat, setShowNewChat] = useState(false);
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
        <ChatsHeaderWrapper
          activeTab={activeTab}
          onCreateGroup={handleCreateGroup}
          onJoinGroup={() => setShowJoinGroup(true)}
          onNewChat={() => setShowNewChat(true)}
        />
      </View>

      <View style={styles.searchContainer}>
        <ChatsSearch value={searchQuery} onChangeText={handleSearch} placeholder="Search chats..." />
      </View>

      <View style={styles.tabsContainer}>
        <ChatTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </View>

      <View style={styles.contentContainer}>
        <ChatsContentWrapper
          isLoading={isLoading}
          searchQuery={searchQuery}
          activeTab={activeTab}
          isSearching={isSearching}
          searchResults={searchResults}
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
      </View>

      <JoinGroupModal
        visible={showJoinGroup}
        onClose={() => {
          setShowJoinGroup(false);
          setInviteCode('');
        }}
        inviteCode={inviteCode}
        onInviteCodeChange={setInviteCode}
        onJoin={handleJoinGroup}
        loading={storeLoading}
      />

      <NewChatModal
        visible={showNewChat}
        onClose={() => setShowNewChat(false)}
        onUserSelect={handleUserSelect}
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

// styles moved to app/(tabs)/styles/chatsStyles.ts
