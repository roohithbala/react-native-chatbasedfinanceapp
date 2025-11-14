import React, { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { useFinanceStore } from '@/lib/store/financeStore';
import { useGroupChat } from '@/hooks/useGroupChat';
import { useTyping } from '@/hooks/useTyping';
import SplitBillModal from '../components/SplitBillModal';
import AddMemberModal from '../components/AddMemberModal';
import GroupManagementModal from '../components/GroupManagementModal';
import MessageInput from '../components/MessageInput';
import { GroupProvider } from '../context/GroupContext';
import { useTheme } from '../context/ThemeContext';
import GroupChatHeader from './components/GroupChatHeader';
import GroupChatMessages from './components/GroupChatMessages';
import { useGroupChatCommands } from '@/lib/hooks/useGroupChatCommands';
import { getGroupChatStyles } from '@/lib/styles/groupChatStyles';
import { MediaViewer } from '../components/MediaViewer';

export default function GroupChatScreen() {
  const { groupId, groupName, action } = useLocalSearchParams<{
    groupId: string;
    groupName: string;
    action?: string;
  }>();

  // Validate groupId
  const validGroupId = groupId && groupId !== 'undefined' && groupId !== 'null' && groupId.trim() !== '' ? groupId : null;

  const { currentUser } = useFinanceStore();
  const { theme } = useTheme();
  const styles = getGroupChatStyles(theme);

  // Use the custom hooks
  const {
    messages,
    isLoading,
    connectionStatus,
    activeGroup,
    sendMessage: sendMessageFromHook,
    loadMessages,
  } = useGroupChat();

  // Set selected group when activeGroup is loaded
  React.useEffect(() => {
    if (activeGroup && activeGroup._id) {
      console.log('GroupChat - Setting selected group:', activeGroup._id);
      useFinanceStore.getState().selectGroup(activeGroup);
    }
  }, [activeGroup]);

  // Auto-open split bill modal if action parameter is set
  React.useEffect(() => {
    if (action === 'split-bill' && activeGroup) {
      console.log('GroupChat - Auto-opening split bill modal from action parameter');
      setShowSplitBillModal(true);
    }
  }, [action, activeGroup]);

  const {
    typingUsers,
  } = useTyping(validGroupId, currentUser?._id);

  const [message, setMessage] = useState('');
  const [showAddMember, setShowAddMember] = useState(false);
  const [showSplitBillModal, setShowSplitBillModal] = useState(false);
  const [showGroupManagement, setShowGroupManagement] = useState(false);
  const [mediaViewerVisible, setMediaViewerVisible] = useState(false);
  const [selectedMediaForViewer, setSelectedMediaForViewer] = useState<any | null>(null);

  const handleMessageChange = (text: string) => {
    setMessage(text);
    // MessageInput component handles mentions internally
  };

  // Use the command handling hook
  const { handleSendMessage: sendMessageCommand } = useGroupChatCommands({
    currentUser,
    validGroupId,
    sendMessage: sendMessageFromHook,
  });

  // Wrapper to clear message after sending
  const handleSendMessage = async () => {
    if (!message.trim()) return;
    
    try {
      await sendMessageCommand(message);
      // Clear the message input after successful send
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      // Don't clear on error so user can retry
    }
  };

  const handleMediaSelect = async (media: {
    uri: string;
    type: 'image' | 'video' | 'audio' | 'document';
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
  }) => {
    await sendMessageFromHook('', media);
  };

  if (!currentUser) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={[styles.errorText, { color: theme.error || '#EF4444' }]}>Please log in to access chat</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!activeGroup) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={[styles.noGroupTitle, { color: theme.text }]}>Group Not Found</Text>
          <Text style={[styles.noGroupText, { color: theme.textSecondary || '#6B7280' }]}>
            The group you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <GroupProvider>
      <SafeAreaView style={styles.container}>
        <GroupChatHeader
          groupName={groupName}
          activeGroup={activeGroup}
          connectionStatus={connectionStatus}
          validGroupId={validGroupId}
          onGroupManagementPress={() => setShowGroupManagement(true)}
          onAddMemberPress={() => setShowAddMember(true)}
        />

        <KeyboardAvoidingView
          style={styles.content}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <GroupChatMessages
            messages={messages}
            isLoading={isLoading}
            typingUsers={typingUsers}
            currentUser={currentUser}
            loadMessages={loadMessages}
            theme={theme}
            onOpenMedia={(mediaUrl, mediaType, fileName) => {
              if (mediaUrl && mediaType) {
                setSelectedMediaForViewer({ mediaUrl, mediaType, fileName });
                setMediaViewerVisible(true);
              }
            }}
          />

          {/* Input */}
          <MessageInput
            message={message}
            onMessageChange={handleMessageChange}
            onSendPress={handleSendMessage}
            onSplitBillPress={() => {
              console.log('GroupChat - Opening split bill modal');
              console.log('GroupChat - validGroupId:', validGroupId);
              console.log('GroupChat - activeGroup:', activeGroup ? {
                id: activeGroup._id,
                name: activeGroup.name,
                memberCount: activeGroup.members?.length,
                members: activeGroup.members?.map((m: any) => ({
                  userId: m.userId?._id,
                  name: m.userId?.name,
                  isActive: m.isActive
                }))
              } : 'null');
              console.log('GroupChat - currentUser:', currentUser ? {
                id: currentUser._id,
                name: currentUser.name
              } : 'null');
              setShowSplitBillModal(true);
            }}
            onMediaSelect={handleMediaSelect}
            groupId={validGroupId || undefined}
            activeGroup={activeGroup}
            isDirectChat={false}
            otherUser={undefined}
            onUserMention={(user) => {
              console.log('User mentioned in group chat:', user);
              // Handle user mention - could show user profile or add to context
            }}
          />
        </KeyboardAvoidingView>

        {/* Split Bill Modal */}
        <SplitBillModal
          visible={showSplitBillModal}
          onClose={() => setShowSplitBillModal(false)}
          groupId={validGroupId}
          groupMembers={activeGroup?.members
            ?.filter((member: any) => member?.userId && member.userId._id !== currentUser?._id)
            ?.map((member: any) => ({
              userId: member.userId._id,
              name: member.userId.name || 'Unknown',
              username: member.userId.username || 'unknown'
            })) || []}
        />

        {/* Add Member Modal */}
        <AddMemberModal
          visible={showAddMember}
          onClose={() => setShowAddMember(false)}
          groupId={validGroupId || ''}
        />

        {/* Group Management Modal */}
        <GroupManagementModal
          visible={showGroupManagement}
          onClose={() => setShowGroupManagement(false)}
          groupId={validGroupId || ''}
          groupName={groupName || activeGroup?.name || 'Group Chat'}
          onAddMember={() => {
            setShowGroupManagement(false);
            setShowAddMember(true);
          }}
        />

        {/* Media Viewer */}
        <MediaViewer
          visible={mediaViewerVisible}
          mediaUrl={selectedMediaForViewer?.mediaUrl || null}
          mediaType={selectedMediaForViewer?.mediaType || null}
          fileName={selectedMediaForViewer?.fileName}
          onClose={() => { setMediaViewerVisible(false); setSelectedMediaForViewer(null); }}
          onDownload={() => {}}
        />
      </SafeAreaView>
    </GroupProvider>
  );
};
