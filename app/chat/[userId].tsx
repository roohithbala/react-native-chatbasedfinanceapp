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
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import { directMessagesAPI } from '@/lib/services/api';
import { useFinanceStore } from '../../lib/store/financeStore';
import { CommandParser } from '../../lib/components/CommandParser';

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
  createdAt: string;
  read: boolean;
}

export default function ChatDetailScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { currentUser } = useFinanceStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [otherUser, setOtherUser] = useState<{
    name: string;
    username: string;
    avatar: string;
  } | null>(null);

  const [showSplitBillModal, setShowSplitBillModal] = useState(false);
  const [splitBillData, setSplitBillData] = useState({
    description: '',
    amount: '',
    category: 'Food'
  });
  const [isSplitMode, setIsSplitMode] = useState(false);

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

      // Send confirmation message with proper details
      const confirmationMessage = `✅ Split bill created!\n📝 ${description}\n💰 Total: ₹${(data.amount || 0).toFixed(2)}\n🤝 Each pays: ₹${((data.amount || 0) / 2).toFixed(2)}\n💸 You paid your share - ${otherUser?.name || 'Friend'} owes you ₹${((data.amount || 0) / 2).toFixed(2)}`;

      try {
        const sent = await directMessagesAPI.sendMessage(userId, confirmationMessage);
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
      const confirmationMessage = `✅ Expense added!\n📝 ${data.description}\n💰 Amount: ₹${(data.amount || 0).toFixed(2)}\n📂 Category: ${data.category}`;
      const sent = await directMessagesAPI.sendMessage(userId, confirmationMessage);
      setMessages(prev => [...prev, sent]);

      Alert.alert('Success', 'Expense added successfully!');
    } catch (error: any) {
      console.error('Error adding expense:', error);
      Alert.alert('Error', error.message || 'Failed to add expense');
    }
  };

  const startSplitBill = () => {
    setIsSplitMode(true);
    setNewMessage('@split ');
    setSplitBillData({
      description: '',
      amount: '',
      category: 'Food'
    });
    setShowSplitBillModal(true);
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

  const handleSplitBillSubmit = async () => {
    if (!splitBillData.description.trim() || !splitBillData.amount.trim()) {
      Alert.alert('Error', 'Please enter description and amount');
      return;
    }

    const amount = parseFloat(splitBillData.amount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (!currentUser?._id || !userId) {
      Alert.alert('Error', 'User information not available');
      return;
    }

    try {
      setIsLoading(true);

      // Calculate amount per person (split between current user and other user)
      const amountPerPerson = amount / 2;

      // Create participants array
      const participants = [
        {
          userId: currentUser._id,
          amount: amountPerPerson
        },
        {
          userId: userId,
          amount: amountPerPerson
        }
      ];

      // Create the split bill (without groupId for direct chat)
      const splitBillPayload = {
        description: splitBillData.description.trim(),
        totalAmount: amount,
        participants: participants,
        splitType: 'equal' as const,
        category: splitBillData.category || 'Split',
        currency: 'INR'
      };

      console.log('Creating direct split bill with payload:', splitBillPayload);
      const result = await useFinanceStore.getState().createSplitBill(splitBillPayload);

      // Create individual expenses for each participant
      for (const participant of participants) {
        const expenseData = {
          description: `${splitBillData.description.trim()} (Split with ${otherUser?.name || 'Friend'})`,
          amount: participant.amount,
          category: splitBillData.category || 'Split',
          userId: participant.userId
          // No groupId for direct chat
        };

        try {
          await useFinanceStore.getState().addExpense(expenseData);
          console.log(`Created expense for participant ${participant.userId}:`, expenseData);
        } catch (expenseError) {
          console.error(`Failed to create expense for participant ${participant.userId}:`, expenseError);
          // Continue with other participants even if one fails
        }
      }

      // Send confirmation message
      const confirmationMessage = `✅ Split bill created!\n📝 ${splitBillData.description.trim()}\n💰 Total: ₹${amount.toFixed(2)}\n🤝 Each pays: ₹${amountPerPerson.toFixed(2)}\n👥 Split with: ${otherUser?.name || 'Friend'}\n💾 Data saved to database`;

      const sent = await directMessagesAPI.sendMessage(userId, confirmationMessage);
      setMessages(prev => [...prev, sent]);

      // Reset modal state
      setShowSplitBillModal(false);
      setSplitBillData({
        description: '',
        amount: '',
        category: 'Food'
      });
      setIsSplitMode(false);

      Alert.alert('Success', 'Split bill created successfully and expenses added to database!');
    } catch (error: any) {
      console.error('Error creating split bill:', error);
      Alert.alert('Error', error.message || 'Failed to create split bill');
    } finally {
      setIsLoading(false);
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
          <Text style={[
            styles.messageText,
            isOwnMessage ? styles.ownMessageText : styles.otherMessageText,
          ]}>
            {item.text}
          </Text>
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
            <TouchableOpacity style={styles.headerButton}>
              <Ionicons name="call" size={20} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton}>
              <Ionicons name="videocam" size={20} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton}>
              <Ionicons name="ellipsis-vertical" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
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

        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TouchableOpacity style={styles.attachButton}>
              <Ionicons name="add-circle" size={24} color="#6366F1" />
            </TouchableOpacity>

            <TextInput
              style={styles.input}
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder="Type a message..."
              placeholderTextColor="#94A3B8"
              multiline
              maxLength={1000}
            />

            <TouchableOpacity
              style={styles.splitBillButton}
              onPress={startSplitBill}
            >
              <Ionicons name="cash" size={20} color="#6366F1" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              styles.sendButton,
              !newMessage.trim() && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={!newMessage.trim()}
          >
            <Ionicons
              name="send"
              size={20}
              color={newMessage.trim() ? 'white' : '#CBD5E1'}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Split Bill Modal */}
      <Modal
        visible={showSplitBillModal}
        animationType="slide"
        presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'overFullScreen'}
        transparent={false}
      >
        <LinearGradient
          colors={['#6366F1', '#8B5CF6']}
          style={styles.modalContainer}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => {
                  setShowSplitBillModal(false);
                  setIsSplitMode(false);
                }}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>💰 Split Bill</Text>
              <TouchableOpacity
                onPress={handleSplitBillSubmit}
                style={styles.modalSaveButton}
              >
                <Text style={styles.modalSaveText}>Send</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <View style={styles.modalCard}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>📝 Description</Text>
                  <TextInput
                    style={styles.textInput}
                    value={splitBillData.description}
                    onChangeText={(text) => setSplitBillData(prev => ({ ...prev, description: text }))}
                    placeholder="What are you splitting?"
                    placeholderTextColor="#94A3B8"
                    maxLength={100}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>💰 Amount</Text>
                  <View style={styles.amountInputContainer}>
                    <Text style={styles.currencySymbol}>₹</Text>
                    <TextInput
                      style={styles.amountInput}
                      value={splitBillData.amount}
                      onChangeText={(text) => {
                        const cleaned = text.replace(/[^0-9.]/g, '');
                        const parts = cleaned.split('.');
                        if (parts.length > 2) return;
                        if (parts[1] && parts[1].length > 2) return;
                        setSplitBillData(prev => ({ ...prev, amount: cleaned }));
                      }}
                      placeholder="0.00"
                      placeholderTextColor="#94A3B8"
                      keyboardType="decimal-pad"
                      maxLength={10}
                    />
                  </View>
                </View>

                {splitBillData.amount && (
                  <View style={styles.splitPreview}>
                    <View style={styles.previewHeader}>
                      <Ionicons name="receipt" size={20} color="#6366F1" />
                      <Text style={styles.previewTitle}>Split Preview</Text>
                    </View>
                    <View style={styles.previewContent}>
                      <View style={styles.previewRow}>
                        <Text style={styles.previewLabel}>Total Amount:</Text>
                        <Text style={styles.previewValue}>₹{parseFloat(splitBillData.amount) || 0}</Text>
                      </View>
                      <View style={styles.previewRow}>
                        <Text style={styles.previewLabel}>Each Person Pays:</Text>
                        <Text style={styles.previewValue}>₹{((parseFloat(splitBillData.amount) || 0) / 2).toFixed(2)}</Text>
                      </View>
                      <View style={styles.previewRow}>
                        <Text style={styles.previewLabel}>Split With:</Text>
                        <Text style={styles.previewValue}>{otherUser?.name || 'Friend'}</Text>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            </ScrollView>
          </SafeAreaView>
        </LinearGradient>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
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
    backgroundColor: '#F8FAFC',
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
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 4,
  },
  otherAvatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
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
    backgroundColor: '#6366F1',
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: 'white',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 6,
  },
  ownMessageText: {
    color: 'white',
  },
  otherMessageText: {
    color: '#1E293B',
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
    color: '#94A3B8',
    alignSelf: 'flex-end',
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
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 16,
    color: '#64748B',
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
    backgroundColor: 'white',
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
    color: '#1E293B',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    color: '#1E293B',
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6366F1',
    paddingLeft: 16,
    paddingRight: 8,
  },
  amountInput: {
    flex: 1,
    padding: 16,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  splitPreview: {
    backgroundColor: '#F0F9FF',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
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
    color: '#64748B',
  },
  previewValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
});
