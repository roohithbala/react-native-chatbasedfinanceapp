import { useState } from 'react';
import { Alert, Share, Platform } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';

export const useProfileActions = () => {
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [groupName, setGroupName] = useState('');

  const handleCreateGroup = async (createGroup: (data: { name: string }) => Promise<void>) => {
    if (!groupName.trim()) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }

    try {
      await createGroup({ name: groupName.trim() });
      setGroupName('');
      setShowGroupModal(false);
      Alert.alert('Success', 'Group created successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to create group');
    }
  };

  const handleShareInvite = async (groupId: string, groups: any[], generateInviteLink: (id: string) => string) => {
    const group = groups.find(g => g._id === groupId);
    if (!group) return;

    const inviteLink = generateInviteLink(groupId);
    const message = `Join my SecureFinance group "${group.name}"!\n\nInvite Code: ${group.inviteCode}\nLink: ${inviteLink}`;

    try {
      if (Platform.OS === 'web') {
        await Clipboard.setStringAsync(message);
        Alert.alert('Copied!', 'Invite link copied to clipboard');
      } else {
        await Share.share({
          message: message,
          title: `Join ${group.name} on SecureFinance`,
        });
      }
    } catch (error) {
      console.error('Share error:', error);
      Alert.alert('Error', 'Failed to share invite');
    }
  };

  const handleLogout = async (logout: () => Promise<void>, isLoading: boolean) => {
    if (isLoading) return;

    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out');
            }
          }
        },
      ]
    );
  };

  return {
    showGroupModal,
    setShowGroupModal,
    showJoinModal,
    setShowJoinModal,
    showEditProfileModal,
    setShowEditProfileModal,
    groupName,
    setGroupName,
    handleCreateGroup,
    handleShareInvite,
    handleLogout,
  };
};