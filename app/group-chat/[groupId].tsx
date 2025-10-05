import React, { useState, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, StatusBar, Platform, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFinanceStore } from '@/lib/store/financeStore';
import { useGroupChat } from '@/hooks/useGroupChat';
import { useTyping } from '@/hooks/useTyping';
import { useCommandHandlers } from '@/hooks/useCommandHandlers';
import ChatMessage from '../components/ChatMessage';
import TypingIndicator from '../components/TypingIndicator';
import SplitBillModal from '../components/SplitBillModal';
import AddMemberModal from '../components/AddMemberModal';
import GroupManagementModal from '../components/GroupManagementModal';
import MessageInput from '../components/MessageInput';
import PaymentsAPI from '@/lib/services/paymentsAPI';
import { CommandParser } from '@/lib/components/CommandParser';
import { Message } from '@/app/types/chat';
import { GroupProvider } from '../context/GroupContext';
import { useTheme } from '../context/ThemeContext';

export default function GroupChatScreen() {
  const { groupId, groupName } = useLocalSearchParams<{
    groupId: string;
    groupName: string;
  }>();

  // Validate groupId
  const validGroupId = groupId && groupId !== 'undefined' && groupId !== 'null' && groupId.trim() !== '' ? groupId : null;

  const { currentUser } = useFinanceStore();
  const { theme } = useTheme();
  const styles = getStyles(theme);

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
  }, [activeGroup?._id]);

  const {
    typingUsers,
    handleMessageChange: handleTypingMessageChange,
  } = useTyping(validGroupId, currentUser?._id);

  const {
    processCommand,
  } = useCommandHandlers(validGroupId || '');

  const [message, setMessage] = useState('');
  const [showAddMember, setShowAddMember] = useState(false);
  const [showSplitBillModal, setShowSplitBillModal] = useState(false);
  const [showGroupManagement, setShowGroupManagement] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleMessageChange = (text: string) => {
    setMessage(text);
    // MessageInput component handles mentions internally
  };

  const handleSendMessage = async () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage) return;

    // Check if the message is a command
    const commandData = CommandParser.parse(trimmedMessage);

    if (commandData && commandData.type !== 'unknown' &&
        (trimmedMessage.startsWith('@addexpense ') ||
         trimmedMessage.startsWith('@predict'))) {
      // Send the command message
      await sendMessageFromHook(trimmedMessage);

      // Process the command
      await processCommand(commandData, trimmedMessage);
    } else if (commandData && (commandData.type === 'split' || commandData.type === 'summary')) {
      // For @split and @summary, just send the message and let backend handle it
      await sendMessageFromHook(trimmedMessage);
    } else {
      // Send as regular message
      await sendMessageFromHook(trimmedMessage);
    }

    setMessage('');
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

  const renderMessage = (msg: Message, index: number) => {
    if (!msg || !msg.user) {
      console.warn('Invalid message object:', msg);
      return null;
    }

    if (!currentUser) {
      console.warn('Current user not available for message rendering');
      return null;
    }

    const isOwnMessage = msg.user._id === currentUser._id;

    return (
      <ChatMessage
        key={`${msg._id}-${msg.createdAt}-${index}`}
        text={msg.text}
        createdAt={msg.createdAt}
        isOwnMessage={isOwnMessage}
        status={msg.status === 'error' ? 'sent' : msg.status}
        type={msg.type}
        senderName={!isOwnMessage ? msg.user.name : undefined}
        splitBillData={msg.splitBillData}
        currentUserId={currentUser._id}
        onPayBill={async (splitBillId: string) => {
          try {
            if (!currentUser?._id) {
              Alert.alert('Error', 'User not authenticated');
              return;
            }

            // Mark the current user as paid for this split bill
            await PaymentsAPI.markParticipantAsPaid(splitBillId, currentUser._id, 'cash');

            Alert.alert('Success', 'Payment marked successfully!');

            // TODO: Refresh messages or update the split bill data in real-time
          } catch (error: any) {
            console.error('Error marking payment:', error);
            Alert.alert('Error', error.message || 'Failed to mark payment');
          }
        }}
        onPaymentSuccess={() => loadMessages()}
        onViewSplitBillDetails={(splitBillId: string) => {
          console.log('View split bill details:', splitBillId);
          // TODO: Implement view details functionality
        }}
        // Multimedia props
        mediaUrl={msg.mediaUrl}
        mediaType={msg.mediaType}
        mediaSize={msg.mediaSize}
        mediaDuration={msg.mediaDuration}
        mediaWidth={msg.mediaWidth}
        mediaHeight={msg.mediaHeight}
        thumbnailUrl={msg.thumbnailUrl}
        fileName={msg.fileName}
        mimeType={msg.mimeType}
        onMediaPress={(mediaUrl: string, mediaType: string) => {
          console.log('Media pressed:', mediaUrl, mediaType);
          // TODO: Implement media viewer
        }}
      />
    );
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
        <StatusBar barStyle="light-content" backgroundColor="#6366F1" />
        <LinearGradient
          colors={['#6366F1', '#8B5CF6', '#EC4899']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() =>{
                router.back();
              }}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.groupInfo}
              onPress={() => setShowGroupManagement(true)}
            >
              <View style={styles.groupAvatar}>
                <Ionicons name="people" size={24} color="white" />
              </View>
              <View style={styles.groupDetails}>
                <Text style={styles.groupName}>{groupName || activeGroup?.name || 'Group Chat'}</Text>
                <Text style={styles.groupMeta}>
                  {activeGroup?.members?.length || 0} members • {connectionStatus === 'online' ? 'Online' : 'Offline'}
                </Text>
              </View>
            </TouchableOpacity>

            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.headerButton} onPress={() => router.push(`/group-stats?groupId=${validGroupId}&groupName=${encodeURIComponent(groupName || activeGroup?.name || 'Group Chat')}`)}>
                <Ionicons name="stats-chart" size={20} color="white" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerButton} onPress={() => router.push(`/voice-call/${validGroupId}?type=group`)}>
                <Ionicons name="call" size={20} color="white" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerButton} onPress={() => router.push(`/video-call/${validGroupId}?type=group`)}>
                <Ionicons name="videocam" size={20} color="white" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => setShowAddMember(true)}
              >
                <Ionicons name="person-add" size={20} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>

        <KeyboardAvoidingView
          style={styles.messagesContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          {/* Messages */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesScrollView}
            contentContainerStyle={styles.messagesContent}
            keyboardShouldPersistTaps="handled"
          >
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <Text style={[styles.loadingText, { color: theme.textSecondary || '#6B7280' }]}>Loading messages...</Text>
              </View>
            ) : messages.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="chatbubble-ellipses" size={64} color="#CBD5E1" style={styles.emptyIcon} />
                <Text style={[styles.emptyTitle, { color: theme.text }]}>No messages yet</Text>
                <Text style={[styles.emptySubtitle, { color: theme.textSecondary || '#64748B' }]}>Start the conversation!</Text>
              </View>
            ) : (
              messages.map((msg, index) => renderMessage(msg, index))
            )}
          </ScrollView>

          {/* Typing Indicators */}
          <TypingIndicator typingUsers={typingUsers} />

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
      </SafeAreaView>
    </GroupProvider>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: theme.textSecondary,
  },
  mentionsContainer: {
    backgroundColor: theme.surface,
    borderTopWidth: 1,
    borderTopColor: theme.border,
    maxHeight: 200,
  },
  mentionsList: {
    padding: 8,
  },
  mentionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
  mentionAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  mentionAvatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
  },
  mentionInfo: {
    flex: 1,
  },
  mentionName: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.text,
  },
  mentionUsername: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  errorText: {
    fontSize: 16,
    color: theme.error,
    textAlign: 'center',
  },
  noGroupTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.text,
    marginTop: 16,
    marginBottom: 8,
  },
  noGroupText: {
    fontSize: 16,
    color: theme.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  backButtonText: {
    color: theme.surface,
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  groupAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  groupDetails: {
    marginLeft: 12,
  },
  groupName: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  groupMeta: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messagesScrollView: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: 16,
  },
  commandHelper: {
    backgroundColor: theme.surface,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  commandChip: {
    backgroundColor: theme.surfaceSecondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  commandChipText: {
    color: theme.primary,
    fontSize: 12,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.surface,
    borderTopWidth: 1,
    borderTopColor: theme.border,
    paddingBottom: Platform.OS === 'ios' ? 34 : 12,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: theme.surfaceSecondary,
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  attachButton: {
    marginRight: 8,
    padding: 4,
  },
  input: {
    flex: 1,
    fontSize: 16,
    maxHeight: 100,
    color: theme.text,
    paddingVertical: 4,
  },
  splitBillButton: {
    marginLeft: 8,
    padding: 4,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  sendButtonDisabled: {
    backgroundColor: theme.surfaceSecondary,
    shadowOpacity: 0,
    elevation: 0,
  },
  moneyIcon: {
    padding: 8,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: theme.surfaceSecondary,
    borderWidth: 1,
    borderColor: theme.border,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  connectionIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  connectionDotOnline: {
    backgroundColor: theme.success,
  },
  connectionDotConnecting: {
    backgroundColor: theme.warning,
  },
  connectionDotOffline: {
    backgroundColor: theme.error,
  },
  connectionText: {
    fontSize: 12,
    color: theme.textSecondary,
  },
  invertedScrollView: {
    // Removed inverted transforms to fix flipped text
  },
  invertedMessagesContainer: {
    // Removed inverted transforms to fix flipped text
  },
  invertedMessage: {
    // Removed inverted transforms to fix flipped text
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    marginBottom: 16,
    opacity: 0.6,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  typingContainer: {
    backgroundColor: theme.surface,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  typingText: {
    fontSize: 14,
    color: theme.textSecondary,
    fontStyle: 'italic',
  },
  noMembersText: {
    fontSize: 14,
    color: theme.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 16,
  },
});
