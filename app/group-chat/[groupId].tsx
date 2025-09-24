import React, { useState, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, StatusBar, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFinanceStore } from '@/lib/store/financeStore';
import { useGroupChat } from '@/hooks/useGroupChat';
import { useMentions } from '@/hooks/useMentions';
import { useTyping } from '@/hooks/useTyping';
import { useCommandHandlers } from '@/hooks/useCommandHandlers';
import ChatMessage from '../components/ChatMessage';
import MentionsList from '../components/MentionsList';
import TypingIndicator from '../components/TypingIndicator';
import SplitBillModal from '../components/SplitBillModal';
import AddMemberModal from '../components/AddMemberModal';
import GroupManagementModal from '../components/GroupManagementModal';
import PaymentsAPI from '@/lib/services/paymentsAPI';
import { CommandParser } from '@/lib/components/CommandParser';
import { Message } from '@/app/types/chat';
import { GroupProvider } from '../context/GroupContext';

export default function GroupChatScreen() {
  const { groupId, groupName } = useLocalSearchParams<{
    groupId: string;
    groupName: string;
  }>();

  // Validate groupId
  const validGroupId = groupId && groupId !== 'undefined' && groupId !== 'null' && groupId.trim() !== '' ? groupId : null;

  const { currentUser } = useFinanceStore();

  // Use the custom hooks
  const {
    messages,
    isLoading,
    connectionStatus,
    activeGroup,
    sendMessage: sendMessageFromHook,
  } = useGroupChat();

  // Set selected group when activeGroup is loaded
  React.useEffect(() => {
    if (activeGroup && activeGroup._id) {
      console.log('GroupChat - Setting selected group:', activeGroup._id);
      useFinanceStore.getState().selectGroup(activeGroup);
    }
  }, [activeGroup?._id]);

  const {
    mentionResults,
    showMentions,
    handleMentionSearch,
    insertMention,
  } = useMentions(activeGroup);

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

    // Check for @ mentions
    const lastAtIndex = text.lastIndexOf('@');
    if (lastAtIndex !== -1) {
      const query = text.slice(lastAtIndex + 1);
      const spaceAfterAt = query.includes(' ');
      if (!spaceAfterAt) {
        handleMentionSearch(query);
      }
    }
  };

  const handleSendMessage = async () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage) return;

    // Check if the message is a command
    const commandData = CommandParser.parse(trimmedMessage);

    if (commandData && commandData.type !== 'unknown') {
      // Send the command message
      await sendMessageFromHook(trimmedMessage);

      // Process the command
      await processCommand(commandData, trimmedMessage);
    } else {
      // Send as regular message
      await sendMessageFromHook(trimmedMessage);
    }

    setMessage('');
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
        locationMentions={msg.locationMentions}
        onLocationMentionPress={(location: any) => {
          console.log('Location pressed:', location);
        }}
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
        onViewSplitBillDetails={(splitBillId: string) => {
          console.log('View split bill details:', splitBillId);
          // TODO: Implement view details functionality
        }}
      />
    );
  };

  if (!currentUser) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>Please log in to access chat</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!activeGroup) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.noGroupTitle}>Group Not Found</Text>
          <Text style={styles.noGroupText}>
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
              <TouchableOpacity style={styles.headerButton}>
                <Ionicons name="call" size={20} color="white" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerButton}>
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

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          keyboardShouldPersistTaps="handled"
        >
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading messages...</Text>
            </View>
          ) : messages.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubble-ellipses" size={64} color="#CBD5E1" style={styles.emptyIcon} />
              <Text style={styles.emptyTitle}>No messages yet</Text>
              <Text style={styles.emptySubtitle}>Start the conversation!</Text>
            </View>
          ) : (
            messages.map((msg, index) => renderMessage(msg, index))
          )}
        </ScrollView>

        {/* Mentions List */}
        <MentionsList
          showMentions={showMentions}
          mentionResults={mentionResults}
          onMentionPress={insertMention}
        />

        {/* Typing Indicators */}
        <TypingIndicator typingUsers={typingUsers} />

        {/* Input */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TouchableOpacity style={styles.attachButton}>
              <Ionicons name="add-circle" size={24} color="#6366F1" />
            </TouchableOpacity>

            <TextInput
              style={styles.input}
              value={message}
              onChangeText={handleMessageChange}
              placeholder="Type a message..."
              placeholderTextColor="#94A3B8"
              multiline
              maxLength={1000}
            />

            <TouchableOpacity
              style={styles.splitBillButton}
              onPress={() => {
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
            >
              <Ionicons name="cash" size={20} color="#6366F1" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              styles.sendButton,
              !message.trim() && styles.sendButtonDisabled,
            ]}
            onPress={handleSendMessage}
            disabled={!message.trim()}
          >
            <Ionicons
              name="send"
              size={20}
              color={message.trim() ? 'white' : '#CBD5E1'}
            />
          </TouchableOpacity>
        </View>

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
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
    color: '#6B7280',
  },
  mentionsContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
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
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  mentionAvatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B5563',
  },
  mentionInfo: {
    flex: 1,
  },
  mentionName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  mentionUsername: {
    fontSize: 14,
    color: '#6B7280',
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
  },
  noGroupTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  noGroupText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  backButtonText: {
    color: '#FFFFFF',
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
  messagesContent: {
    paddingVertical: 16,
  },
  commandHelper: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  commandChip: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  commandChipText: {
    color: '#2563EB',
    fontSize: 12,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingBottom: Platform.OS === 'ios' ? 34 : 12,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F8FAFC',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  attachButton: {
    marginRight: 8,
    padding: 4,
  },
  input: {
    flex: 1,
    fontSize: 16,
    maxHeight: 100,
    color: '#1E293B',
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
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  sendButtonDisabled: {
    backgroundColor: '#E2E8F0',
    shadowOpacity: 0,
    elevation: 0,
  },
  moneyIcon: {
    padding: 8,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
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
    backgroundColor: '#10B981',
  },
  connectionDotConnecting: {
    backgroundColor: '#F59E0B',
  },
  connectionDotOffline: {
    backgroundColor: '#EF4444',
  },
  connectionText: {
    fontSize: 12,
    color: '#6B7280',
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
    color: '#1E293B',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
  },
  typingContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  typingText: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  noMembersText: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 16,
  },
});
