import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Keyboard,
  Modal,
  ScrollView,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import SplitBillModal from '../components/SplitBillModal';
import { directMessagesAPI } from '@/lib/services/api';
import { useFinanceStore } from '../../lib/store/financeStore';
import { CommandParser } from '../../lib/components/CommandParser';
import { useTheme } from '../context/ThemeContext';
import MessageInput from '../components/MessageInput';
import SplitBillMessage from '../components/SplitBillMessage';

interface Message {
  _id: string;
  text: string;
  sender: {
    _id: string;
    name: string;
    username: string;
    avatar?: string;
  };
  receiver?: {
    _id: string;
    name: string;
    username: string;
    avatar?: string;
  };
  splitBillData?: {
    _id: string;
    description: string;
    totalAmount: number;
    participants: Array<{
      userId: {
        _id: string;
        name: string;
        username: string;
      };
      amount: number;
      isPaid: boolean;
      paidAt?: string;
    }>;
    isSettled: boolean;
  };
  createdAt: string;
  read: boolean;
}

interface SplitBillMessageProps {
  splitBillData: {
    _id: string;
    description: string;
    totalAmount: number;
    participants: Array<{
      userId: {
        _id: string;
        name: string;
        username: string;
      };
      amount: number;
      isPaid: boolean;
      paidAt?: string;
    }>;
    isSettled: boolean;
  };
  currentUserId?: string;
  otherUserName: string;
  isOwnMessage: boolean;
  onPaymentSuccess?: () => void;
}

export default function ChatDetailScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { currentUser } = useFinanceStore();
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [otherUser, setOtherUser] = useState<{
    name: string;
    username: string;
    avatar: string;
  } | null>(null);

  const [showSplitBillModal, setShowSplitBillModal] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<{
    uri: string;
    type: 'image' | 'video' | 'audio' | 'document';
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
  } | null>(null);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Message[]>([]);

  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 5000); // Poll for new messages
    return () => clearInterval(interval);
  }, [userId]);

  const loadMessages = async () => {
    try {
      const history = await directMessagesAPI.getChatHistory(userId);
      setMessages(history);
      if (history.length > 0) {
        // Find the other user from the first message
        const firstMessage = history[0];
        
        // Determine which user is the other user (not current user)
        let otherUserInfo = null;
        
        if (firstMessage.sender && firstMessage.sender._id === currentUser?._id) {
          // Current user is the sender, so receiver is the other user
          otherUserInfo = firstMessage.receiver;
        } else if (firstMessage.receiver && firstMessage.receiver._id === currentUser?._id) {
          // Current user is the receiver, so sender is the other user
          otherUserInfo = firstMessage.sender;
        } else {
          // Fallback: try to find any user that's not the current user
          otherUserInfo = firstMessage.sender || firstMessage.receiver;
        }

        // Ensure we have the required fields
        if (otherUserInfo && otherUserInfo.name && otherUserInfo.username) {
          setOtherUser({
            name: otherUserInfo.name,
            username: otherUserInfo.username,
            avatar: otherUserInfo.avatar || otherUserInfo.name.charAt(0).toUpperCase()
          });
        } else {
          console.warn('Could not determine other user from message:', firstMessage);
        }
      }
      setIsLoading(false);
      // Mark messages as read
      await directMessagesAPI.markAsRead(userId);
    } catch (error) {
      console.error('Error loading messages:', error);
      setIsLoading(false);
      // Show error to user
      Alert.alert('Error', 'Failed to load messages. Please try again.');
    }
  };

  const handleSplitBillCommand = async (data: any) => {
    try {
      console.log('Direct chat handleSplitBillCommand called with data:', data);
      console.log('Data type checks:', {
        data: !!data,
        dataAmount: !!data?.amount,
        dataAmountValue: data?.amount,
        dataAmountType: typeof data?.amount,
        amountGreaterThanZero: data?.amount > 0
      });

      if (!data || !data.amount || data.amount <= 0) {
        console.log('Validation failed - invalid amount data');
        Alert.alert('Error', 'Please specify a valid amount for the split bill');
        return;
      }

      if (!currentUser?._id) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }

      // Handle both old and new command formats
      let participants = [];
      let description = data.description || 'Split Bill';

      if (data.username) {
        // New format: @split @username category amount
        // We need to find the user ID for the username
        // For now, assume the username matches the other user's username
        if (otherUser && otherUser.username === data.username) {
          participants = [
            {
              userId: currentUser._id,
              amount: data.amount / 2,
            },
            {
              userId: userId,
              amount: data.amount / 2,
            }
          ];
          description = data.description;
        } else {
          Alert.alert('Error', `User @${data.username} not found in this chat`);
          return;
        }
      } else {
        // Legacy format: handle participants array
        participants = data.participants || [];
        if (participants.length === 0) {
          // Default to splitting with the current chat user
          participants = [
            {
              userId: currentUser._id,
              amount: data.amount / 2,
            },
            {
              userId: userId,
              amount: data.amount / 2,
            }
          ];
        }
      }

      // For direct chats, create a personal split bill without a group
      const splitBillData = {
        description: description,
        totalAmount: data.amount,
        participants: participants,
        splitType: 'equal' as const,
        category: data.category || 'Other',
        currency: 'INR'
      };

      console.log('Creating split bill with data:', splitBillData);
      const result = await useFinanceStore.getState().createSplitBill(splitBillData);
      console.log('Split bill creation result:', result);

      if (!result) {
        throw new Error('Failed to create split bill');
      }

      // Send confirmation message with split bill data
      const confirmationMessage = {
        text: `✅ Split bill created!\n📝 ${description}\n💰 Total: ₹${(data.amount || 0).toFixed(2)}\n🤝 Each pays: ₹${((data.amount || 0) / 2).toFixed(2)}\n💸 You paid your share - ${otherUser?.name || 'Friend'} owes you ₹${((data.amount || 0) / 2).toFixed(2)}`,
        splitBillData: {
          _id: result._id,
          description: description,
          totalAmount: data.amount,
          participants: result.participants,
          isSettled: result.isSettled
        }
      };

      try {
        // Send message with split bill data
        const sent = await directMessagesAPI.sendMessage(userId, confirmationMessage.text, confirmationMessage.splitBillData);
        setMessages(prev => [...prev, sent]);
      } catch (sendError) {
        console.error('Error sending confirmation message:', sendError);
        // Still show success even if confirmation message fails
      }

      Alert.alert('Success', 'Split bill created successfully!');
    } catch (error: any) {
      console.error('Error creating split bill:', error);
      Alert.alert('Error', error.message || 'Failed to create split bill');
    }
  };

  const handleExpenseCommand = async (data: any) => {
    try {
      if (!data || !data.amount || data.amount <= 0) {
        Alert.alert('Error', 'Please specify a valid amount for the expense');
        return;
      }

      if (!currentUser?._id) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }

      // Create expense data
      const expenseData = {
        description: data.description,
        amount: data.amount,
        category: data.category,
        userId: currentUser._id
      };

      // Add the expense
      const { addExpense } = useFinanceStore.getState();
      await addExpense(expenseData);

      // Send confirmation message
      const confirmationMessage = `✅ Expense added!\n📝 ${data.description}\n💰 Amount: $${(data.amount || 0).toFixed(2)}\n📂 Category: ${data.category}`;
      const sent = await directMessagesAPI.sendMessage(userId, confirmationMessage);
      setMessages(prev => [...prev, sent]);

      Alert.alert('Success', 'Expense added successfully!');
    } catch (error: any) {
      console.error('Error adding expense:', error);
      Alert.alert('Error', error.message || 'Failed to add expense');
    }
  };

  const startSplitBill = () => {
    setShowSplitBillModal(true);
  };

  const handleMediaSelect = (media: {
    uri: string;
    type: 'image' | 'video' | 'audio' | 'document';
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
  }) => {
    setSelectedMedia(media);
  };

  const handleMediaSend = async () => {
    if (!selectedMedia) return;

    try {
      // Create FormData for the file
      const formData = new FormData();
      formData.append(selectedMedia.type, {
        uri: selectedMedia.uri,
        type: selectedMedia.mimeType || `application/octet-stream`,
        name: selectedMedia.fileName || `file-${Date.now()}`,
      } as any);

      let uploadResponse;
      switch (selectedMedia.type) {
        case 'image':
          uploadResponse = await directMessagesAPI.uploadImage(userId, formData);
          break;
        case 'video':
          uploadResponse = await directMessagesAPI.uploadVideo(userId, formData);
          break;
        case 'audio':
          uploadResponse = await directMessagesAPI.uploadAudio(userId, formData);
          break;
        case 'document':
          uploadResponse = await directMessagesAPI.uploadDocument(userId, formData);
          break;
        default:
          throw new Error('Unsupported media type');
      }

      if (uploadResponse && uploadResponse.status === 'success') {
        // Add the uploaded message to the chat
        const uploadedMessage = uploadResponse.data.message;
        setMessages(prev => [...prev, uploadedMessage]);
        setSelectedMedia(null); // Clear selected media after successful upload
      } else {
        throw new Error('Upload failed');
      }
    } catch (error: any) {
      console.error('Error sending media:', error);
      Alert.alert('Error', error.message || 'Failed to send media');
    }
  };

  const handleMediaCancel = () => {
    setSelectedMedia(null);
  };

  const handleSearchMessages = () => {
    setShowSearchModal(true);
  };

  const performSearch = (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    const filteredMessages = messages.filter(message =>
      message.text.toLowerCase().includes(query.toLowerCase())
    );
    setSearchResults(filteredMessages);
  };

  const handleSearchQueryChange = (query: string) => {
    setSearchQuery(query);
    performSearch(query);
  };

  const scrollToMessage = (messageId: string) => {
    const messageIndex = messages.findIndex(msg => msg._id === messageId);
    if (messageIndex !== -1) {
      flatListRef.current?.scrollToIndex({
        index: messageIndex,
        animated: true,
        viewPosition: 0.5
      });
    }
    setShowSearchModal(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleClearChat = async () => {
    try {
      // Call API to clear chat messages
      await directMessagesAPI.clearChat(userId);
      
      // Clear local messages state
      setMessages([]);
      
      Alert.alert('Success', 'Chat cleared successfully!');
    } catch (error: any) {
      console.error('Error clearing chat:', error);
      Alert.alert('Error', error.message || 'Failed to clear chat');
    }
  };

  const handleBlockUser = async () => {
    try {
      // Call API to block user
      await directMessagesAPI.blockUser(userId);
      
      Alert.alert('Success', `${otherUser?.name || 'User'} has been blocked.`);
      
      // Navigate back to chats list
      router.back();
    } catch (error: any) {
      console.error('Error blocking user:', error);
      Alert.alert('Error', error.message || 'Failed to block user');
    }
  };

  const handleHamburgerMenu = () => {
    router.push('/expenses');
  };

  const handleSend = async () => {
    if (!newMessage.trim()) return;

    try {
      const messageToSend = newMessage.trim();

      // Check if the message is a command
      const commandData = CommandParser.parse(messageToSend);

      if (commandData && commandData.type !== 'unknown') {
        // Send the original command message first
        const sentCommand = await directMessagesAPI.sendMessage(userId, messageToSend);
        setMessages(prev => [...prev, sentCommand]);

        // Then handle the command
        if (commandData.type === 'split') {
          await handleSplitBillCommand(commandData.data);
        } else if (commandData.type === 'expense') {
          await handleExpenseCommand(commandData.data);
        }
      } else {
        // Send as regular message
        const sent = await directMessagesAPI.sendMessage(userId, messageToSend);
        setMessages(prev => [...prev, sent]);
      }

      setNewMessage('');
      Keyboard.dismiss();
    } catch (error: any) {
      console.error('Error sending message:', error);
      Alert.alert('Error', error.message || 'Failed to send message');
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwnMessage = item.sender._id === currentUser?._id;

    return (
      <View
        style={[
          styles.messageContainer,
          isOwnMessage ? styles.ownMessage : styles.otherMessage,
        ]}
      >
        {!isOwnMessage && (
          <View style={styles.otherAvatarContainer}>
            <Text style={styles.otherAvatarText}>
              {item.sender.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}

        <View
          style={[
            styles.messageBubble,
            isOwnMessage ? styles.ownBubble : styles.otherBubble,
          ]}
        >
          {item.splitBillData ? (() => {
            const transformedParticipants = item.splitBillData.participants.map(p => ({
              userId: typeof p.userId === 'object' ? p.userId._id : p.userId,
              name: typeof p.userId === 'object' ? p.userId.name : 'Unknown',
              amount: p.amount,
              isPaid: p.isPaid
            }));

            const currentUserShare = transformedParticipants.find(p => p.userId === currentUser?._id)?.amount || 0;
            const currentUserPaid = transformedParticipants.find(p => p.userId === currentUser?._id)?.isPaid || false;

            return (
              <SplitBillMessage
                splitBillData={{
                  splitBillId: item.splitBillData._id,
                  description: item.splitBillData.description,
                  totalAmount: item.splitBillData.totalAmount,
                  participants: transformedParticipants,
                  userShare: currentUserShare,
                  isPaid: currentUserPaid
                }}
                currentUserId={currentUser?._id || ''}
                onPaymentSuccess={() => {
                  // Refresh messages to show updated payment status
                  loadMessages();
                }}
              />
            );
          })() : (
            <Text style={[
              styles.messageText,
              isOwnMessage ? styles.ownMessageText : styles.otherMessageText,
            ]}>
              {item.text}
            </Text>
          )}
          <Text style={[
            styles.messageTime,
            isOwnMessage ? styles.ownMessageTime : styles.otherMessageTime,
          ]}>
            {format(new Date(item.createdAt), 'HH:mm')}
          </Text>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  return (
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
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>

          {otherUser && (
            <View style={styles.userInfo}>
              <View style={styles.avatarContainer}>
                <Text style={styles.avatarText}>{otherUser.avatar}</Text>
              </View>
              <View style={styles.userDetails}>
                <Text style={styles.userName}>{otherUser.name}</Text>
                <Text style={styles.userStatus}>Active now</Text>
              </View>
            </View>
          )}

          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerButton} onPress={() => router.push(`/voice-call/${userId}?type=personal`)}>
              <Ionicons name="call" size={20} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton} onPress={() => router.push(`/video-call/${userId}?type=personal`)}>
              <Ionicons name="videocam" size={20} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton} onPress={handleHamburgerMenu}>
              <Ionicons name="ellipsis-vertical" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="chatbubble-outline" size={64} color="#CBD5E1" />
              </View>
              <Text style={styles.emptyText}>No messages yet</Text>
              <Text style={styles.emptySubtext}>
                Start the conversation by sending a message
              </Text>
            </View>
          }
        />

        <MessageInput
          message={newMessage}
          onMessageChange={setNewMessage}
          onSendPress={handleSend}
          onSplitBillPress={startSplitBill}
          onMediaSelect={handleMediaSelect}
          selectedMedia={selectedMedia}
          onMediaSend={handleMediaSend}
          onMediaCancel={handleMediaCancel}
        />
      </KeyboardAvoidingView>

      {/* Split Bill Modal */}
      <SplitBillModal
        visible={showSplitBillModal}
        onClose={() => setShowSplitBillModal(false)}
        groupId={null}
        groupMembers={[{
          userId: userId,
          name: otherUser?.name || 'Friend',
          username: otherUser?.username || 'friend'
        }]}
      />

      {/* Search Modal */}
      <Modal
        visible={showSearchModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSearchModal(false)}
      >
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
          <View style={styles.searchHeader}>
            <TouchableOpacity
              style={styles.searchBackButton}
              onPress={() => setShowSearchModal(false)}
            >
              <Ionicons name="arrow-back" size={24} color={theme.text} />
            </TouchableOpacity>
            <TextInput
              style={[styles.searchInput, { color: theme.text, backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}
              placeholder="Search messages..."
              placeholderTextColor={theme.textSecondary}
              value={searchQuery}
              onChangeText={handleSearchQueryChange}
              autoFocus
            />
          </View>

          <FlatList
            data={searchResults}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.searchResultItem, { backgroundColor: theme.surface, borderColor: theme.border }]}
                onPress={() => scrollToMessage(item._id)}
              >
                <View style={styles.searchResultContent}>
                  <Text style={[styles.searchResultText, { color: theme.text }]}>
                    {item.text}
                  </Text>
                  <Text style={[styles.searchResultTime, { color: theme.textSecondary }]}>
                    {format(new Date(item.createdAt), 'MMM dd, HH:mm')}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              searchQuery.trim() ? (
                <View style={styles.searchEmptyContainer}>
                  <Ionicons name="search-outline" size={48} color={theme.textSecondary} />
                  <Text style={[styles.searchEmptyText, { color: theme.textSecondary }]}>
                    No messages found for &quot;{searchQuery}&quot;
                  </Text>
                </View>
              ) : (
                <View style={styles.searchEmptyContainer}>
                  <Ionicons name="chatbubble-outline" size={48} color={theme.textSecondary} />
                  <Text style={[styles.searchEmptyText, { color: theme.textSecondary }]}>
                    Enter a search term to find messages
                  </Text>
                </View>
              )
            }
            contentContainerStyle={styles.searchResultsList}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
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
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  userDetails: {
    marginLeft: 12,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  userStatus: {
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
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.background,
  },
  messageList: {
    padding: 16,
    paddingBottom: 20,
  },
  messageContainer: {
    marginVertical: 6,
    maxWidth: '85%',
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  ownMessage: {
    alignSelf: 'flex-end',
    marginLeft: 60,
  },
  otherMessage: {
    alignSelf: 'flex-start',
    marginRight: 60,
  },
  otherAvatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 4,
  },
  otherAvatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
  },
  messageBubble: {
    padding: 14,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  ownBubble: {
    backgroundColor: theme.primary,
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: theme.surface,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: theme.border,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 6,
  },
  ownMessageText: {
    color: theme.surface,
  },
  otherMessageText: {
    color: theme.text,
  },
  messageTime: {
    fontSize: 11,
    fontWeight: '500',
  },
  ownMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
    alignSelf: 'flex-end',
  },
  otherMessageTime: {
    color: theme.textSecondary,
    alignSelf: 'flex-end',
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: theme.border,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 16,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  modalSaveButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalCard: {
    backgroundColor: theme.surface,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: theme.surfaceSecondary,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: theme.border,
    color: theme.text,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surfaceSecondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.primary,
    paddingLeft: 16,
    paddingRight: 8,
  },
  amountInput: {
    flex: 1,
    padding: 16,
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.text,
  },
  splitPreview: {
    backgroundColor: theme.surfaceSecondary,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.border,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
    marginLeft: 8,
  },
  previewContent: {
    gap: 12,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewLabel: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  previewValue: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  searchBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  searchResultsList: {
    padding: 16,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  searchResultContent: {
    flex: 1,
  },
  searchResultText: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 4,
  },
  searchResultTime: {
    fontSize: 12,
  },
  searchEmptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  searchEmptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
  splitBillContainer: {
    padding: 12,
  },
  splitBillHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  splitBillTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 6,
  },
  splitBillDescription: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  splitBillDetails: {
    marginBottom: 12,
  },
  splitBillRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  splitBillLabel: {
    fontSize: 14,
  },
  splitBillValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  paidText: {
    fontSize: 12,
    fontWeight: '600',
  },
  splitBillActions: {
    flexDirection: 'row',
    gap: 8,
  },
  payButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  payButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  remindButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  remindButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  settledContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 4,
  },
  settledText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
