import { useState } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { useFinanceStore } from '../lib/store/financeStore';

export const useChatActions = (addNewChatToList?: (user: any) => void) => {
  const [showJoinGroup, setShowJoinGroup] = useState(false);
  const [inviteCode, setInviteCode] = useState('');

  const { joinGroupByCode, loadGroups } = useFinanceStore();

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

  const handleUserSelect = (item: any) => {
    const userId = typeof item === 'string' ? item : item._id;

    // If we have user info and the addNewChatToList function, add to recent chats
    if (typeof item === 'object' && item._id && addNewChatToList) {
      addNewChatToList(item);
    }

    router.push(`/chat/${userId}`);
  };

  const handleGroupSelect = (group: any) => {
    router.push({
      pathname: '/group-chat/[groupId]',
      params: { groupId: group._id, groupName: group.name }
    });
  };

  const handleCreateGroup = () => {
    router.push('/create-group');
  };

  const handleAddMembers = (groupId: string, groupName: string) => {
    router.push({
      pathname: '/add-members',
      params: {
        groupId,
        groupName
      }
    });
  };

  return {
    showJoinGroup,
    setShowJoinGroup,
    inviteCode,
    setInviteCode,
    handleJoinGroup,
    handleUserSelect,
    handleGroupSelect,
    handleCreateGroup,
    handleAddMembers,
  };
};