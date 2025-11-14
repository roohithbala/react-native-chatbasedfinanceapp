import { useState } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import RelationshipsAPI from '../app/lib/services/relationshipsAPI';
import ReportsAPI from '../app/lib/services/reportsAPI';

export const useMenuActions = () => {
  const [showMenu, setShowMenu] = useState(false);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [mutedChats, setMutedChats] = useState<Set<string>>(new Set());
  const [blockedUsers, setBlockedUsers] = useState<Set<string>>(new Set());
  const [archivedChats, setArchivedChats] = useState<Set<string>>(new Set());

  const handleMenuPress = (chat: any) => {
    setSelectedChat(chat);
    // For React Native, we can use a default position or calculate it differently
    // Since we can't reliably get touch coordinates from onPress events
    setMenuPosition({ x: 150, y: 200 }); // Default position, can be improved later
    setShowMenu(true);
  };

  const handleMenuOption = async (option: string, activeTab: 'chats' | 'groups', setRecentChats: any) => {
    if (!selectedChat) return;

    try {
      switch (option) {
        case 'mute':
          if (activeTab === 'chats') {
            if (mutedChats.has(selectedChat._id)) {
              await RelationshipsAPI.unmuteChat(selectedChat._id);
              const newMuted = new Set(mutedChats);
              newMuted.delete(selectedChat._id);
              setMutedChats(newMuted);
              Alert.alert('Success', 'Chat unmuted');
            } else {
              await RelationshipsAPI.muteChat(selectedChat._id);
              const newMuted = new Set(mutedChats);
              newMuted.add(selectedChat._id);
              setMutedChats(newMuted);
              Alert.alert('Success', 'Chat muted');
            }
          } else {
            if (mutedChats.has(selectedChat._id)) {
              await RelationshipsAPI.unmuteGroup(selectedChat._id);
              const newMuted = new Set(mutedChats);
              newMuted.delete(selectedChat._id);
              setMutedChats(newMuted);
              Alert.alert('Success', 'Group unmuted');
            } else {
              await RelationshipsAPI.muteGroup(selectedChat._id);
              const newMuted = new Set(mutedChats);
              newMuted.add(selectedChat._id);
              setMutedChats(newMuted);
              Alert.alert('Success', 'Group muted');
            }
          }
          break;

        case 'block':
          if (blockedUsers.has(selectedChat._id)) {
            await RelationshipsAPI.unblockUser(selectedChat._id);
            const newBlocked = new Set(blockedUsers);
            newBlocked.delete(selectedChat._id);
            setBlockedUsers(newBlocked);
            Alert.alert('Success', 'User unblocked');
          } else {
            await RelationshipsAPI.blockUser(selectedChat._id);
            const newBlocked = new Set(blockedUsers);
            newBlocked.add(selectedChat._id);
            setBlockedUsers(newBlocked);
            Alert.alert('Success', 'User blocked');
          }
          break;

        case 'archive':
          if (activeTab === 'chats') {
            if (archivedChats.has(selectedChat._id)) {
              await RelationshipsAPI.unarchiveChat(selectedChat._id);
              const newArchived = new Set(archivedChats);
              newArchived.delete(selectedChat._id);
              setArchivedChats(newArchived);
              Alert.alert('Success', 'Chat unarchived');
            } else {
              await RelationshipsAPI.archiveChat(selectedChat._id);
              const newArchived = new Set(archivedChats);
              newArchived.add(selectedChat._id);
              setArchivedChats(newArchived);
              Alert.alert('Success', 'Chat archived');
            }
          } else {
            if (archivedChats.has(selectedChat._id)) {
              await RelationshipsAPI.unarchiveGroup(selectedChat._id);
              const newArchived = new Set(archivedChats);
              newArchived.delete(selectedChat._id);
              setArchivedChats(newArchived);
              Alert.alert('Success', 'Group unarchived');
            } else {
              await RelationshipsAPI.archiveGroup(selectedChat._id);
              const newArchived = new Set(archivedChats);
              newArchived.add(selectedChat._id);
              setArchivedChats(newArchived);
              Alert.alert('Success', 'Group archived');
            }
          }
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
                onPress: async () => {
                  try {
                    // Remove from recent chats or groups
                    if (activeTab === 'chats') {
                      setRecentChats((prev: any) => prev.filter((chat: any) => chat._id !== selectedChat._id));
                    } else {
                      // For groups, you might want to leave the group instead
                      Alert.alert('Info', 'To delete a group conversation, you need to leave the group first.');
                      return;
                    }
                    Alert.alert('Success', 'Conversation deleted');
                  } catch (error) {
                    Alert.alert('Error', 'Failed to delete conversation');
                  }
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
            'Are you sure you want to report this user? This will send a notification to our development team.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Report',
                style: 'destructive',
                onPress: async () => {
                  try {
                    await ReportsAPI.reportUser(
                      selectedChat._id,
                      selectedChat.user?.username || selectedChat.username || 'Unknown',
                      'User reported via chat menu',
                      `User ${selectedChat.user?.name || selectedChat.name || 'Unknown'} was reported for inappropriate behavior.`
                    );
                    Alert.alert('Success', 'Report submitted successfully. Our team will review this report and take appropriate action.');
                  } catch (error: any) {
                    console.error('Error submitting report:', error);
                    Alert.alert('Error', error.message || 'Failed to submit report. Please try again.');
                  }
                }
              }
            ]
          );
          break;

        case 'splitBill':
          if (activeTab === 'groups') {
            // For groups, navigate to group chat and auto-open split bill modal
            router.push({
              pathname: `/group-chat/${selectedChat._id}`,
              params: { 
                groupId: selectedChat._id,
                groupName: selectedChat.name,
                action: 'split-bill'
              }
            });
          } else {
            // For direct chats, navigate to direct chat and auto-open split bill modal
            router.push({
              pathname: `/chat/${selectedChat._id}`,
              params: { 
                userId: selectedChat._id,
                action: 'split-bill'
              }
            });
          }
          break;

        case 'viewProfile':
          if (activeTab === 'chats') {
            // Navigate to the selected user's profile
            router.push(`/profile/${selectedChat._id}`);
          } else {
            // For groups in chat list, navigate to group info/details screen
            router.push({
              pathname: '/group-settings',
              params: { 
                groupId: selectedChat._id,
                mode: 'info'  // Read-only group information
              }
            });
          }
          break;
      }
    } catch (error: any) {
      console.error('Menu action error:', error);
      Alert.alert('Error', error.message || 'Failed to perform action');
    }

    setShowMenu(false);
    setSelectedChat(null);
  };

  return {
    showMenu,
    setShowMenu,
    selectedChat,
    menuPosition,
    mutedChats,
    blockedUsers,
    archivedChats,
    handleMenuPress,
    handleMenuOption,
  };
};