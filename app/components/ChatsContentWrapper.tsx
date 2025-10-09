import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import ChatsTabContent from '@/app/components/ChatsTabContent';
import SearchResults from '@/app/components/SearchResults';

type Props = any;

export default function ChatsContentWrapper(props: Props) {
  const {
    isLoading,
    searchQuery,
    activeTab,
    isSearching,
    searchResults,
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
  } = props;

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
        <Text>Loading chats...</Text>
      </View>
    );
  }

  if (searchQuery.trim() && activeTab === 'chats') {
    return <SearchResults searchResults={searchResults} isSearching={isSearching} onUserSelect={handleUserSelect} />;
  }

  return (
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
  );
}
