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
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { directMessagesAPI } from '../services/api';
import { useFinanceStore } from '../../lib/store/financeStore';
import { CommandParser } from '../../lib/components/CommandParser';

interface Message {
  _id: string;
  text: string;
  sender: {
    _id: string;
    name: string;
    username: string;
    avatar: string;
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
        const otherUserInfo = firstMessage.sender._id === currentUser?._id
          ? firstMessage.receiver
          : firstMessage.sender;

        // Ensure we have the required fields
        if (otherUserInfo && otherUserInfo.name && otherUserInfo.username) {
          setOtherUser({
            name: otherUserInfo.name,
            username: otherUserInfo.username,
            avatar: otherUserInfo.avatar || otherUserInfo.name.charAt(0).toUpperCase()
          });
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
      if (!data.amount || data.amount <= 0) {
        Alert.alert('Error', 'Please specify a valid amount for the split bill');
        return;
      }

      if (!currentUser?._id) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }

      // For direct chats, create a personal split bill without a group
      // This will be tracked as a direct debt between users
      const splitBillData = {
        description: data.description,
        totalAmount: data.amount,
        groupId: null, // Direct chat split bill
        participants: [
          {
            userId: currentUser._id,
            amount: data.amount / 2, // Split equally
            isPaid: true // Current user has paid their share
          },
          {
            userId: userId,
            amount: data.amount / 2, // Split equally
            isPaid: false // Other user owes this amount
          }
        ],
        category: 'Other',
        currency: 'INR'
      };

      // Create the split bill
      const { createSplitBill } = useFinanceStore.getState();
      const result = await createSplitBill(splitBillData);

      // Send confirmation message
      const confirmationMessage = `✅ Split bill created!\n📝 ${data.description}\n💰 Total: ₹${(data.amount || 0).toFixed(2)}\n🤝 Each pays: ₹${((data.amount || 0) / 2).toFixed(2)}\n� You paid your share - ${otherUser?.name || 'Friend'} owes you ₹${((data.amount || 0) / 2).toFixed(2)}`;
      const sent = await directMessagesAPI.sendMessage(userId, confirmationMessage);
      setMessages(prev => [...prev, sent]);

      Alert.alert('Success', 'Split bill created successfully!');
    } catch (error: any) {
      console.error('Error creating split bill:', error);
      Alert.alert('Error', error.message || 'Failed to create split bill');
    }
  };

  const handleExpenseCommand = async (data: any) => {
    try {
      if (!data.amount || data.amount <= 0) {
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
        userId: currentUser._id,
        groupId: undefined // Personal expense, no group
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
      // Check if the message is a command
      const commandData = CommandParser.parse(newMessage.trim());

      if (commandData && commandData.type !== 'unknown') {
        // Handle the command
        if (commandData.type === 'split') {
          await handleSplitBillCommand(commandData.data);
        } else if (commandData.type === 'expense') {
          await handleExpenseCommand(commandData.data);
        }
      } else {
        // Send as regular message
        const sent = await directMessagesAPI.sendMessage(userId, newMessage.trim());
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

    // Create the split bill command
    const command = `@split ${splitBillData.description} ₹${amount}`;

    setNewMessage(command);
    setShowSplitBillModal(false);
    setIsSplitMode(false);

    // Send the message
    await handleSend();
  };  const renderMessage = ({ item }: { item: Message }) => {
    const isOwnMessage = item.sender._id === currentUser?._id;

    return (
      <View
        style={[
          styles.messageContainer,
          isOwnMessage ? styles.ownMessage : styles.otherMessage,
        ]}
      >
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
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        {otherUser && (
          <View style={styles.userInfo}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>{otherUser.avatar}</Text>
            </View>
            <View>
              <Text style={styles.userName}>{otherUser.name}</Text>
              <Text style={styles.userUsername}>@{otherUser.username}</Text>
            </View>
          </View>
        )}
      </View>

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
          inverted={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No messages yet</Text>
              <Text style={styles.emptySubtext}>
                Send a message to start the conversation
              </Text>
            </View>
          }
        />

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Type a message..."
            placeholderTextColor="#94A3B8"
            multiline
          />
          <View style={styles.inputButtons}>
            <TouchableOpacity
              style={styles.splitBillButton}
              onPress={startSplitBill}
            >
              <Ionicons name="cash" size={20} color="#2563EB" />
            </TouchableOpacity>
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
                color={newMessage.trim() ? 'white' : '#94A3B8'}
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Split Bill Modal */}
      <Modal
        visible={showSplitBillModal}
        animationType="slide"
        presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'overFullScreen'}
        transparent={false}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => {
                setShowSplitBillModal(false);
                setIsSplitMode(false);
              }}>
                <Text style={styles.modalCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>💰 Split Bill</Text>
              <TouchableOpacity onPress={handleSplitBillSubmit}>
                <Text style={styles.modalSave}>Send</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
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

              {splitBillData.amount && (
                <View style={styles.splitPreview}>
                  <Text style={styles.previewTitle}>Split Preview:</Text>
                  <Text style={styles.previewText}>
                    Total: ${parseFloat(splitBillData.amount) || 0}
                  </Text>
                  <Text style={styles.previewText}>
                    Each person pays: ₹{((parseFloat(splitBillData.amount) || 0) / 2).toFixed(2)}
                  </Text>
                  <Text style={styles.previewText}>
                    Split with: {otherUser?.name || 'Friend'}
                  </Text>
                </View>
              )}
            </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  userUsername: {
    fontSize: 12,
    color: '#64748B',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageList: {
    padding: 16,
  },
  messageContainer: {
    marginVertical: 4,
    maxWidth: '80%',
  },
  ownMessage: {
    alignSelf: 'flex-end',
  },
  otherMessage: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
  },
  ownBubble: {
    backgroundColor: '#8B5CF6',
  },
  otherBubble: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  messageText: {
    fontSize: 16,
    marginBottom: 4,
  },
  ownMessageText: {
    color: 'white',
  },
  otherMessageText: {
    color: '#1E293B',
  },
  messageTime: {
    fontSize: 12,
  },
  ownMessageTime: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  otherMessageTime: {
    color: '#64748B',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  input: {
    flex: 1,
    marginRight: 12,
    padding: 12,
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    fontSize: 16,
    maxHeight: 100,
    color: '#1E293B',
  },
  inputButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  splitBillButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#F1F5F9',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: 'white',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  modalCancel: {
    fontSize: 16,
    color: '#64748B',
  },
  modalSave: {
    fontSize: 16,
    color: '#2563EB',
    fontWeight: '600',
  },
  modalContent: {
    padding: 20,
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
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    color: '#1E293B',
  },
  amountInput: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    fontSize: 20,
    fontWeight: 'bold',
    borderWidth: 2,
    borderColor: '#10B981',
    color: '#1E293B',
    textAlign: 'center',
  },
  splitPreview: {
    backgroundColor: '#F0F9FF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  previewText: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 4,
  },
});
