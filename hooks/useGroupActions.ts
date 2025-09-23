import { useState } from 'react';
import { useFinanceStore } from '../lib/store/financeStore';
import { router } from 'expo-router';

export const useGroupActions = () => {
  const { createGroup, joinGroupByCode, addMemberToGroup } = useFinanceStore();
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [joiningGroup, setJoiningGroup] = useState(false);
  const [addingMember, setAddingMember] = useState(false);

  const handleCreateGroup = async (groupData: { name: string; avatar?: string }) => {
    try {
      setCreatingGroup(true);
      await createGroup(groupData);
      router.push('/(tabs)/chats');
    } catch (error: any) {
      throw error;
    } finally {
      setCreatingGroup(false);
    }
  };

  const handleJoinGroup = async (inviteCode: string) => {
    try {
      setJoiningGroup(true);
      await joinGroupByCode(inviteCode);
    } catch (error: any) {
      throw error;
    } finally {
      setJoiningGroup(false);
    }
  };

  const handleAddMember = async (groupId: string, identifier: string, searchType: 'email' | 'username' = 'email') => {
    try {
      setAddingMember(true);
      await addMemberToGroup(groupId, identifier, searchType);
    } catch (error: any) {
      throw error;
    } finally {
      setAddingMember(false);
    }
  };

  const navigateToGroup = (groupId: string) => {
    router.push(`/group-chat/${groupId}`);
  };

  return {
    creatingGroup,
    joiningGroup,
    addingMember,
    handleCreateGroup,
    handleJoinGroup,
    handleAddMember,
    navigateToGroup,
  };
};