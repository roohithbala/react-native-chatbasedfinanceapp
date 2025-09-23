import { useState } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';

export const useMenuActions = () => {
  const [showMenu, setShowMenu] = useState(false);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [mutedChats, setMutedChats] = useState<Set<string>>(new Set());
  const [blockedUsers, setBlockedUsers] = useState<Set<string>>(new Set());
  const [archivedChats, setArchivedChats] = useState<Set<string>>(new Set());

  const handleMenuPress = (chat: any, event: any) => {
    setSelectedChat(chat);
    setMenuPosition({ x: event.nativeEvent.pageX, y: event.nativeEvent.pageY });
    setShowMenu(true);
  };

  const handleMenuOption = (option: string, activeTab: 'groups' | 'direct', setRecentChats: any) => {
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
                  setRecentChats((prev: any) => prev.filter((chat: any) => chat._id !== selectedChat._id));
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