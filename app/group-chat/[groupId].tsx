import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import socketService from '@/app/services/socketService';
import { chatAPI } from '@/app/services/api';
import { useFinanceStore } from '@/lib/store/financeStore';
import AddMemberModal from '@/app/components/AddMemberModal';
import ChatBubble from '@/app/components/ChatBubble';
import { Message as BaseMessage } from '@/app/types/chat';

interface Message extends Omit<BaseMessage, 'readBy' | 'status'> {
  readBy: Array<{
    userId: string;
    readAt: string;
  }>;
  status: 'sent' | 'delivered' | 'read';
}

interface ChatUser {
  _id: string;
  name: string;
  username: string;
}

export default function GroupChatScreen() {
  const { groupId, groupName } = useLocalSearchParams<{ 
    groupId: string; 
    groupName: string;
  }>();
  
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionResults, setMentionResults] = useState<ChatUser[]>([]);
  const [showMentions, setShowMentions] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);
  const mentionTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  
  const { usersAPI } = require('@/app/services/api');
  const { currentUser, groups, selectGroup, selectedGroup } = useFinanceStore();

  const currentGroup = groups.find(g => g._id === groupId) || selectedGroup;

  useEffect(() => {
    if (groupId && currentGroup) {
      selectGroup(currentGroup);
      loadMessages();
      connectSocket();
    }

    return () => {
      socketService.disconnect();
    };
  }, [groupId, currentGroup]);

  const handleMentionSearch = async (query: string) => {
    if (mentionTimeout.current) {
      clearTimeout(mentionTimeout.current);
    }

    setMentionQuery(query);
    
    if (query.length < 1) {
      setShowMentions(false);
      return;
    }

    mentionTimeout.current = setTimeout(async () => {
      try {
        const users = await usersAPI.searchByUsername(query);
        setMentionResults(users);
        setShowMentions(users.length > 0);
      } catch (error) {
        console.error('Error searching users:', error);
      }
    }, 300);
  };

  const handleMessageChange = (text: string) => {
    setMessage(text);
    
    // Check for @ mentions
    const lastAtIndex = text.lastIndexOf('@');
    if (lastAtIndex !== -1) {
      const query = text.slice(lastAtIndex + 1);
      const spaceAfterAt = query.includes(' ');
      if (!spaceAfterAt) {
        handleMentionSearch(query);
      } else {
        setShowMentions(false);
      }
    } else {
      setShowMentions(false);
    }
  };

  const insertMention = (user: ChatUser) => {
    const lastAtIndex = message.lastIndexOf('@');
    const newMessage = message.slice(0, lastAtIndex) + `@${user.username} `;
    setMessage(newMessage);
    setShowMentions(false);
  };

  const connectSocket = async () => {
    try {
      if (!groupId) return;
      await socketService.connect();
      socketService.joinGroup(groupId);
      
      socketService.onReceiveMessage((msg) => {
        setMessages(prev => [msg, ...prev]);
      });

      socketService.onError((error) => {
        Alert.alert('Error', error.message);
      });
    } catch (error) {
      console.error('Socket connection error:', error);
      Alert.alert('Connection Error', 'Failed to connect to chat server');
    }
  };

  const loadMessages = async () => {
    try {
      setIsLoading(true);
      if (!groupId) return;

      const response = await chatAPI.getMessages(groupId);
      
      if (response.status !== 'success' || !response.data?.messages) {
        throw new Error('Failed to load messages');
      }

      const loadedMessages = response.data.messages.reverse();
      
      setMessages([
        {
          _id: 'welcome',
          text: `Welcome to ${groupName || currentGroup?.name || 'Group Chat'}! 🎉\n\nUse commands:\n@split [description] $[amount] @user1 @user2\n@addexpense [description] $[amount]\n@predict - Get spending predictions\n@summary - View group expenses`,
          createdAt: new Date().toISOString(),
          user: { _id: 'system', name: 'AI Assistant' },
          type: 'system',
          status: 'sent',
          groupId: groupId,
          readBy: []
        },
        ...loadedMessages.map(msg => ({
          ...msg,
          status: msg.status === 'error' ? 'sent' : msg.status,
          readBy: msg.readBy.map(receipt => ({
            userId: receipt.userId,
            readAt: typeof receipt.readAt === 'string' ? receipt.readAt : receipt.readAt.toISOString()
          }))
        }))
      ]);
    } catch (error: any) {
      console.error('Error loading messages:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to load messages. Please try again.';
      Alert.alert('Error', errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!message.trim() || !currentUser || !groupId) return;

    try {
      const response = await chatAPI.sendMessage(groupId, { 
        text: message,
        type: message.startsWith('@') ? 'system' : 'text',
        status: 'sent'
      });

      if (response.status !== 'success' || !response.data?.message) {
        throw new Error('Failed to send message');
      }

      // Add user's message
      const newMessage: Message = {
        _id: response.data.message._id,
        text: message,
        createdAt: new Date().toISOString(),
        user: { 
          _id: currentUser._id, 
          name: currentUser.name,
          avatar: currentUser.avatar
        },
        groupId: groupId,
        type: message.startsWith('@') ? 'command' : 'text',
        status: 'sent',
        readBy: []
      };

      // Add system message if available
      const systemMessage = response.data.systemMessage;
      if (systemMessage) {
        setMessages(prev => [
          {
            _id: systemMessage._id || 'sys-' + Date.now(),
            text: systemMessage.text || '',
            createdAt: systemMessage.createdAt || new Date().toISOString(),
            user: { _id: 'system', name: 'AI Assistant' },
            type: 'system',
            status: 'sent',
            groupId: groupId,
            readBy: []
          },
          newMessage,
          ...prev
        ]);
      } else {
        setMessages(prev => [newMessage, ...prev]);
      }

      setMessage('');
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    } catch (error: any) {
      console.error('Error sending message:', error);
      Alert.alert('Error', error.message || 'Failed to send message. Please try again.');
    }
  };

  const renderMessage = (msg: Message) => {
    const isOwnMessage = msg.user._id === currentUser?._id;

    return (
      <ChatBubble
        key={msg._id}
        text={msg.text}
        createdAt={msg.createdAt}
        isOwnMessage={isOwnMessage}
        status={msg.status}
        type={msg.type}
        senderName={!isOwnMessage ? msg.user.name : undefined}
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

  if (!currentGroup) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Ionicons name="people-outline" size={48} color="#6B7280" />
          <Text style={styles.noGroupTitle}>Group Not Found</Text>
          <Text style={styles.noGroupText}>
            The group you're looking for doesn't exist or you don't have access to it.
          </Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="#2563EB" />
            </TouchableOpacity>
            
            <View style={styles.groupInfo}>
              <Text style={styles.groupName}>
                {groupName || currentGroup.name}
              </Text>
              <Text style={styles.memberCount}>
                {currentGroup.members.length} members
              </Text>
            </View>
            
            <View style={styles.headerActions}>
              <TouchableOpacity 
                style={styles.headerButton}
                onPress={() => setShowAddMember(true)}
              >
                <Ionicons name="person-add" size={20} color="#2563EB" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerButton}>
                <Ionicons name="ellipsis-vertical" size={20} color="#2563EB" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <AddMemberModal
          visible={showAddMember}
          onClose={() => setShowAddMember(false)}
          groupId={groupId}
        />

        {/* Messages */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading messages...</Text>
          </View>
        ) : (
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={[
              styles.messagesContent,
              { flexDirection: 'column-reverse' }
            ]}
            showsVerticalScrollIndicator={false}
          >
            {messages.map(renderMessage)}
          </ScrollView>
        )}

        {/* Command Helper */}
        <View style={styles.commandHelper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity 
              style={styles.commandChip}
              onPress={() => setMessage('@split Dinner $50 @alice @bob')}
            >
              <Text style={styles.commandChipText}>@split</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.commandChip}
              onPress={() => setMessage('@addexpense Coffee $5')}
            >
              <Text style={styles.commandChipText}>@addexpense</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.commandChip}
              onPress={() => setMessage('@predict')}
            >
              <Text style={styles.commandChipText}>@predict</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.commandChip}
              onPress={() => setMessage('@summary')}
            >
              <Text style={styles.commandChipText}>@summary</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Mentions List */}
        {showMentions && mentionResults.length > 0 && (
          <View style={styles.mentionsContainer}>
            <ScrollView style={styles.mentionsList}>
              {mentionResults.map((user) => (
                <TouchableOpacity
                  key={user._id}
                  style={styles.mentionItem}
                  onPress={() => insertMention(user)}
                >
                  <View style={styles.mentionAvatar}>
                    <Text style={styles.mentionAvatarText}>
                      {user.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.mentionInfo}>
                    <Text style={styles.mentionName}>{user.name}</Text>
                    <Text style={styles.mentionUsername}>@{user.username}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Input */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              value={message}
              onChangeText={handleMessageChange}
              placeholder="Type @ to mention someone..."
              placeholderTextColor="#9CA3AF"
              multiline
              maxLength={500}
              returnKeyType="send"
              onSubmitEditing={sendMessage}
              blurOnSubmit={false}
            />
            <TouchableOpacity
              style={[styles.sendButton, !message.trim() && styles.sendButtonDisabled]}
              onPress={sendMessage}
              disabled={!message.trim()}
            >
              <Ionicons 
                name="send" 
                size={20} 
                color={message.trim() ? '#FFFFFF' : '#9CA3AF'} 
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
  backButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  groupInfo: {
    flex: 1,
    marginLeft: 16,
  },
  groupName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  memberCount: {
    fontSize: 14,
    color: '#6B7280',
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
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
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F3F4F6',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 48,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    maxHeight: 100,
    paddingVertical: 8,
    textAlignVertical: 'center',
  },
  sendButton: {
    backgroundColor: '#2563EB',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
});
