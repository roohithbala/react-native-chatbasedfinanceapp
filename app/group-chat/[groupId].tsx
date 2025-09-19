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
  Modal,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import socketService from '@/app/services/socketService';
import { chatAPI } from '@/app/services/api';
import { useFinanceStore } from '@/lib/store/financeStore';
import AddMemberModal from '@/app/components/AddMemberModal';
import ChatBubble from '@/app/components/ChatBubble';
import LocationMentionInput from '@/app/components/LocationMentionInput';
import { Message as BaseMessage } from '@/app/types/chat';
import { CommandParser } from '@/lib/components/CommandParser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@/app/services/api';

interface Message extends Omit<BaseMessage, 'readBy' | 'status'> {
  readBy: Array<{
    userId: string;
    readAt: string | Date;
  }>;
  status: 'sent' | 'delivered' | 'read' | 'error';
  locationMentions?: Array<{
    locationId: string;
    locationName: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  }>;
  isTemp?: boolean; // For temporary messages before server confirmation
}

interface ChatUser {
  _id: string;
  name: string;
  username: string;
}

interface SplitBillData {
  description: string;
  amount: string;
  participants: ChatUser[];
  category: string;
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
  const [showSplitBillModal, setShowSplitBillModal] = useState(false);
  const [splitBillData, setSplitBillData] = useState<SplitBillData>({
    description: '',
    amount: '',
    participants: [],
    category: 'Food'
  });
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<ChatUser[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline' | 'connecting'>('connecting');
  const [isOnline, setIsOnline] = useState(true);
  const [isSplitMode, setIsSplitMode] = useState(false);
  
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);
  const mentionTimeout = useRef<NodeJS.Timeout | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

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
      // Clean up typing indicators
      if (isTyping && groupId) {
        socketService.stopTyping(groupId);
      }
      socketService.disconnect();
    };
  }, [groupId, currentGroup]);

  const handleMessageChange = (text: string) => {
    setMessage(text);
    
    // Handle typing indicators
    if (text.trim() && !isTyping && groupId) {
      setIsTyping(true);
      socketService.startTyping(groupId);
    } else if (!text.trim() && isTyping && groupId) {
      setIsTyping(false);
      socketService.stopTyping(groupId);
    }

    // Clear existing typing timeout
    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
    }

    // Set new typing timeout
    if (text.trim()) {
      typingTimeout.current = setTimeout(() => {
        if (isTyping && groupId) {
          setIsTyping(false);
          socketService.stopTyping(groupId);
        }
      }, 2000); // Stop typing after 2 seconds of inactivity
    }
    
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
        // Only search within group members
        const groupMembers = currentGroup?.members || [];
        const memberUsernames = groupMembers.map(m => m.user.username);
        
        const users = await usersAPI.searchByUsername(query);
        // Filter to only show group members
        const filteredUsers = users.filter((user: ChatUser) => 
          memberUsernames.includes(user.username) && 
          user._id !== currentUser?._id
        );
        
        setMentionResults(filteredUsers);
        setShowMentions(filteredUsers.length > 0);
      } catch (error) {
        console.error('Error searching users:', error);
      }
    }, 300);
  };

  const startSplitBill = () => {
    setIsSplitMode(true);
    setMessage('@split ');
    setSplitBillData({
      description: '',
      amount: '',
      participants: [],
      category: 'Food'
    });
  };

  const handleSplitBillCommand = async (data: any) => {
    try {
      if (!data || !data.amount || data.amount <= 0) {
        Alert.alert('Error', 'Please specify a valid amount for the split bill');
        return;
      }

      if (!currentUser?._id) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }

      if (!groupId) {
        Alert.alert('Error', 'Group not found');
        return;
      }

      // Get group members for split bill
      const groupMembers = currentGroup?.members || [];
      const participants = [];

      // If specific participants are mentioned, use them
      if (data.participants && data.participants.length > 0) {
        for (const participantUsername of data.participants) {
          const member = groupMembers.find(m => m.user.username === participantUsername);
          if (member) {
            participants.push({
              userId: member.user._id,
              amount: data.amount / (data.participants.length + 1) // Include creator
            });
          }
        }
      } else {
        // Split equally among all group members
        const totalParticipants = groupMembers.length;
        for (const member of groupMembers) {
          participants.push({
            userId: member.user._id,
            amount: data.amount / totalParticipants
          });
        }
      }

      // Add the creator as a participant if not already included
      const creatorIncluded = participants.some(p => p.userId === currentUser._id);
      if (!creatorIncluded) {
        participants.push({
          userId: currentUser._id,
          amount: data.amount / participants.length
        });
      }

      // Create the split bill
      const splitBillData = {
        description: data.description || 'Split Bill',
        totalAmount: data.amount,
        groupId: groupId,
        participants: participants,
        splitType: 'equal' as const,
        category: data.category || 'Split',
        currency: 'INR'
      };

      console.log('Creating split bill with data:', splitBillData);
      const result = await useFinanceStore.getState().createSplitBill(splitBillData);

      // Send confirmation message
      const participantNames = participants
        .filter(p => p.userId !== currentUser._id)
        .map(p => {
          const member = groupMembers.find(m => m.user._id === p.userId);
          return member?.user.name || 'Unknown';
        })
        .join(', ');

      const confirmationMessage = `✅ Split bill created!\n📝 ${data.description || 'Split Bill'}\n💰 Total: ₹${(data.amount || 0).toFixed(2)}\n🤝 Each pays: ₹${((data.amount || 0) / participants.length).toFixed(2)}\n👥 Participants: ${participantNames || 'All group members'}`;
      
      await sendMessage(confirmationMessage);

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
        userId: currentUser._id,
        groupId: groupId
      };

      // Add the expense
      const { addExpense } = useFinanceStore.getState();
      await addExpense(expenseData);

      // Send confirmation message
      const confirmationMessage = `✅ Expense added!\n📝 ${data.description}\n💰 Amount: ₹${(data.amount || 0).toFixed(2)}\n📂 Category: ${data.category}`;
      await sendMessage(confirmationMessage);

      Alert.alert('Success', 'Expense added successfully!');
    } catch (error: any) {
      console.error('Error adding expense:', error);
      Alert.alert('Error', error.message || 'Failed to add expense');
    }
  };

  const handleSplitBillSubmit = async () => {
    if (!splitBillData.description.trim() || !splitBillData.amount.trim()) {
      Alert.alert('Error', 'Please enter description and amount');
      return;
    }

    if (splitBillData.participants.length === 0) {
      Alert.alert('Error', 'Please select at least one participant');
      return;
    }

    const amount = parseFloat(splitBillData.amount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    // Create the split bill command
    const participantMentions = splitBillData.participants.map(p => `@${p.username}`).join(' ');
    const command = `@split ${splitBillData.description} ₹${amount} ${participantMentions}`;
    
    setMessage(command);
    setShowSplitBillModal(false);
    setIsSplitMode(false);
    
    // Send the message
    await sendMessage();
  };

  const handlePredictCommand = async () => {
    try {
      console.log('Handling @predict command');
      const response = await fetch(`${API_BASE_URL}/ai/predict`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await AsyncStorage.getItem('authToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('AI prediction response:', data);

      // Create AI response message
      const aiMessage: Message = {
        _id: `ai-${Date.now()}`,
        text: `🤖 AI Predictions:\n\n${data.predictions?.map((p: any) =>
          `• ${p.message}${p.suggestion ? `\n  💡 ${p.suggestion}` : ''}`
        ).join('\n\n') || 'No predictions available'}`,
        createdAt: new Date().toISOString(),
        user: {
          _id: 'ai-assistant',
          name: 'AI Assistant',
          username: 'ai',
          avatar: '🤖'
        },
        type: 'text' as const,
        status: 'sent' as const,
        readBy: [],
        groupId: groupId,
        isTemp: false
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error handling predict command:', error);
      Alert.alert('Error', 'Failed to get AI predictions. Please try again.');
    }
  };

  const handleSummaryCommand = async () => {
    try {
      console.log('Handling @summary command');
      const response = await fetch(`${API_BASE_URL}/ai/summary`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await AsyncStorage.getItem('authToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('AI summary response:', data);

      // Create AI response message
      const aiMessage: Message = {
        _id: `ai-${Date.now()}`,
        text: `📊 Financial Summary:\n\n💰 Total Expenses: ₹${data.totalExpenses?.toFixed(2) || '0.00'}\n💵 Personal: ₹${data.totalPersonalExpenses?.toFixed(2) || '0.00'}\n🤝 Split Bills: ₹${data.totalSplitExpenses?.toFixed(2) || '0.00'}\n\n📈 Expense Count: ${data.expenseCount || 0}\n🔄 Split Bills: ${data.splitBillCount || 0}\n\n📂 Top Categories:\n${Object.entries(data.categoryBreakdown || {}).map(([cat, amount]: [string, any]) => 
          `• ${cat}: ₹${Number(amount).toFixed(2)}`
        ).join('\n') || 'No category data'}`,
        createdAt: new Date().toISOString(),
        user: {
          _id: 'ai-assistant',
          name: 'AI Assistant',
          username: 'ai',
          avatar: '🤖'
        },
        type: 'text' as const,
        status: 'sent' as const,
        readBy: [],
        groupId: groupId,
        isTemp: false
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error handling summary command:', error);
      Alert.alert('Error', 'Failed to get financial summary. Please try again.');
    }
  };

  const connectSocket = async () => {
    try {
      if (!groupId) return;
      await socketService.connect();
      socketService.joinGroup(groupId);
      
      // Set up WhatsApp-like features
      socketService.onConnectionStatusChange((online) => {
        setConnectionStatus(online ? 'online' : 'offline');
        setIsOnline(online);
      });

      socketService.onReceiveMessage((msg) => {
        if (!msg || !msg._id) {
          console.warn('Invalid message received:', msg);
          return;
        }
        
        console.log('Received message:', msg);
        // Only add message if it's not already in the list and not a temp message
        setMessages(prev => {
          const messageExists = prev.some(m => m._id === msg._id);
          const tempMessageExists = prev.some(m => 
            m.isTemp && 
            m.text === msg.text && 
            m.user._id === msg.user._id &&
            Math.abs(new Date(m.createdAt).getTime() - new Date(msg.createdAt).getTime()) < 5000 // Within 5 seconds
          );
          
          if (messageExists) return prev;
          
          // If we have a temp message that matches, replace it with the server message
          if (tempMessageExists) {
            return prev.map(m => 
              m.isTemp && 
              m.text === msg.text && 
              m.user._id === msg.user._id &&
              Math.abs(new Date(m.createdAt).getTime() - new Date(msg.createdAt).getTime()) < 5000
                ? { ...msg, isTemp: false }
                : m
            );
          }
          
          // Otherwise, add the new message
          return [...prev, msg];
        });
      });

      socketService.onTypingStart((data) => {
        if (!data || !data.user) {
          console.warn('Invalid typing start data:', data);
          return;
        }
        
        const { groupId: typingGroupId, user } = data;
        if (typingGroupId === groupId && user) {
          setTypingUsers(prev => {
            const userExists = prev.some(u => u._id === user._id);
            if (userExists) return prev;
            return [...prev, { 
              _id: user._id, 
              name: user.name || 'Unknown', 
              username: user.username || 'unknown' 
            }];
          });
        }
      });

      socketService.onTypingStop((data) => {
        if (!data || !data.user) {
          console.warn('Invalid typing stop data:', data);
          return;
        }
        
        const { groupId: typingGroupId, user } = data;
        if (typingGroupId === groupId && user) {
          setTypingUsers(prev => prev.filter(u => u._id !== user._id));
        }
      });

      socketService.onMessageRead((data) => {
        if (!data || !data.messageId || !data.userId) {
          console.warn('Invalid message read data:', data);
          return;
        }
        
        const { messageId, userId } = data;
        setMessages(prev => prev.map(msg => 
          msg._id === messageId 
            ? { 
                ...msg, 
                readBy: [...(msg.readBy || []), { userId, readAt: new Date().toISOString() }] 
              }
            : msg
        ));
      });

      socketService.onError((error) => {
        console.error('Socket error:', error);
        setConnectionStatus('offline');
        Alert.alert('Connection Error', error?.message || 'Failed to connect to chat server');
      });
    } catch (error) {
      console.error('Socket connection error:', error);
      setConnectionStatus('offline');
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

      const loadedMessages = response.data.messages;
      
      setMessages([
        {
          _id: 'welcome',
          text: `Welcome to ${groupName || currentGroup?.name || 'Group Chat'}! 🎉\n\nUse commands:\n@split [description] $[amount] @user1 @user2\n@addexpense [description] $[amount]\n@predict - Get spending predictions\n@summary - View group expenses` +
          `\n\n💡 Tip: Use the "Split Bill" button for easy bill splitting!`,
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

  const sendMessage = async (messageText?: string) => {
    const textToSend = messageText || message;
    if (!textToSend.trim() || !currentUser || !groupId) return;

    const trimmedMessage = textToSend.trim();
    
    // Only clear the input if we're sending the current message
    if (!messageText) {
      setMessage('');
    }

    try {
      // Create the message object immediately for local state
      const tempMessageId = `temp-${Date.now()}-${Math.random()}`;
      const messageToAdd = {
        _id: tempMessageId,
        text: trimmedMessage,
        createdAt: new Date().toISOString(),
        user: {
          _id: currentUser._id,
          name: currentUser.name || 'Unknown',
          username: currentUser.username || 'unknown',
          avatar: currentUser.avatar || currentUser.name?.charAt(0).toUpperCase()
        },
        type: 'text' as const,
        status: 'sent' as const,
        readBy: [] as Array<{ userId: string; readAt: string }>,
        groupId: groupId,
        isTemp: true // Mark as temporary until confirmed by server
      };

      // Immediately add message to local state (WhatsApp-like behavior)
      setMessages(prev => [...prev, messageToAdd]);

      // Scroll to bottom to show the new message
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);

      // Check if the message is a command
      const commandData = CommandParser.parse(trimmedMessage);

      if (commandData && commandData.type !== 'unknown') {
        // Send the original command message first
        const response = await chatAPI.sendMessage(groupId, { 
          text: trimmedMessage,
          type: 'command',
          status: 'sent'
        });

        if (response.status !== 'success' || !response.data?.message) {
          throw new Error('Failed to send message');
        }

        // Replace temp message with server message
        const serverMessage = response.data.message;
        setMessages(prev => prev.map(msg => 
          msg._id === tempMessageId 
            ? { ...serverMessage, isTemp: false }
            : msg
        ));

        // Then handle the command
        if (commandData.type === 'split') {
          await handleSplitBillCommand(commandData.data);
        } else if (commandData.type === 'expense') {
          await handleExpenseCommand(commandData.data);
        } else if (commandData.type === 'predict') {
          await handlePredictCommand();
        } else if (commandData.type === 'summary') {
          await handleSummaryCommand();
        }
      } else {
        // Send as regular message
        const response = await chatAPI.sendMessage(groupId, { 
          text: trimmedMessage,
          type: 'text',
          status: 'sent'
        });

        if (response.status !== 'success' || !response.data?.message) {
          throw new Error('Failed to send message');
        }

        // Replace temp message with server message
        const serverMessage = response.data.message;
        setMessages(prev => prev.map(msg => 
          msg._id === tempMessageId 
            ? { ...serverMessage, isTemp: false }
            : msg
        ));
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      
      // Remove the temp message on error
      setMessages(prev => prev.filter(msg => msg._id !== `temp-${Date.now()}-${Math.random()}`));
      
      // Restore the message if sending failed and it was the current message
      if (!messageText) {
        setMessage(trimmedMessage);
      }
      Alert.alert('Error', error?.message || 'Failed to send message. Please try again.');
    }
  };

  const renderMessage = (msg: Message) => {
    if (!msg || !msg.user) {
      console.warn('Invalid message object:', msg);
      return null;
    }
    
    const isOwnMessage = msg.user._id === currentUser?._id;

    return (
      <ChatBubble
        key={msg._id}
        text={msg.text}
        createdAt={msg.createdAt}
        isOwnMessage={isOwnMessage}
        status={msg.status === 'error' ? 'sent' : msg.status}
        type={msg.type}
        senderName={!isOwnMessage ? msg.user.name : undefined}
        locationMentions={msg.locationMentions}
        onLocationMentionPress={(location) => {
          // Handle location mention press - could navigate to map or show location details
          console.log('Location pressed:', location);
          // TODO: Navigate to location details or show on map
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

  if (!currentGroup) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Ionicons name="people-outline" size={48} color="#6B7280" />
          <Text style={styles.noGroupTitle}>Group Not Found</Text>
          <Text style={styles.noGroupText}>
            The group you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
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
              <Ionicons name="arrow-back" size={20} color="#2563EB" />
            </TouchableOpacity>
            
            <View style={styles.groupInfo}>
              <Text style={styles.groupName}>
                {groupName || (currentGroup?.name) || 'Group Chat'}
              </Text>
              <View style={styles.statusRow}>
                <Text style={styles.memberCount}>
                  {currentGroup?.members?.length || 0} members
                </Text>
                <View style={styles.connectionIndicator}>
                  <View style={[
                    styles.connectionDot,
                    connectionStatus === 'online' && styles.connectionDotOnline,
                    connectionStatus === 'connecting' && styles.connectionDotConnecting,
                    connectionStatus === 'offline' && styles.connectionDotOffline
                  ]} />
                  <Text style={styles.connectionText}>
                    {connectionStatus === 'online' ? 'Online' : 
                     connectionStatus === 'connecting' ? 'Connecting...' : 'Offline'}
                  </Text>
                </View>
              </View>
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
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: false })}
            onLayout={() => scrollViewRef.current?.scrollToEnd({ animated: false })}
          >
            {messages.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No messages yet</Text>
                <Text style={styles.emptySubtext}>
                  Send a message to start the conversation
                </Text>
              </View>
            ) : (
              messages.map((msg) => renderMessage(msg))
            )}
          </ScrollView>
        )}

        {/* Command Helper */}
        <View style={styles.commandHelper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity 
              style={styles.commandChip}
              onPress={startSplitBill}
            >
              <Text style={styles.commandChipText}>💰 Split Bill</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.commandChip}
              onPress={() => setMessage('@addexpense Lunch $15')}
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
              {mentionResults.map((user) => {
                if (!user || !user.name || !user.username) {
                  console.warn('Invalid user object in mentions:', user);
                  return null;
                }
                
                return (
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
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Typing Indicators */}
        {typingUsers.length > 0 && (
          <View style={styles.typingContainer}>
            <Text style={styles.typingText}>
              {typingUsers.length === 1 
                ? `${typingUsers[0]?.name || 'Someone'} is typing...`
                : `${typingUsers.length} people are typing...`
              }
            </Text>
          </View>
        )}

        {/* Input */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <LocationMentionInput
              style={styles.textInput}
              value={message}
              onChangeText={handleMessageChange}
              placeholder="Type @ to mention someone or a location..."
              onLocationMention={(location) => {
                console.log('Location mentioned:', location);
                // Handle location mention - could show location preview or navigate to map
              }}
            />
            <TouchableOpacity
              style={[styles.sendButton, !message.trim() && styles.sendButtonDisabled]}
              onPress={() => sendMessage()}
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

      {/* Enhanced Split Bill Modal */}
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
              <Text style={styles.modalTitle}>💰 Create Split Bill</Text>
              <TouchableOpacity onPress={handleSplitBillSubmit}>
                <Text style={styles.modalSave}>Create</Text>
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

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>👥 Select Participants</Text>
                <Text style={styles.participantsHint}>
                  Choose group members to split with:
                </Text>
                <View style={styles.participantsContainer}>
                  {currentGroup?.members
                    ?.filter(member => member?.user && member.user._id !== currentUser?._id)
                    ?.map((member) => {
                      if (!member || !member.user) {
                        console.warn('Invalid member object:', member);
                        return null;
                      }
                      
                      const isSelected = splitBillData.participants.some(p => p._id === member.user._id);
                      return (
                        <TouchableOpacity
                          key={member.user._id}
                          style={[
                            styles.participantChip,
                            isSelected && styles.participantChipSelected,
                          ]}
                          onPress={() => {
                            setSplitBillData(prev => ({
                              ...prev,
                              participants: isSelected
                                ? prev.participants.filter(p => p._id !== member.user._id)
                                : [...prev.participants, {
                                    _id: member.user._id,
                                    name: member.user.name || 'Unknown',
                                    username: member.user.username || 'unknown'
                                  }]
                            }));
                          }}
                        >
                          <Text style={styles.participantAvatar}>
                            {(member.user.name || 'U').charAt(0).toUpperCase()}
                          </Text>
                          <Text
                            style={[
                              styles.participantName,
                              isSelected && styles.participantNameSelected,
                            ]}
                          >
                            {member.user.name || 'Unknown'}
                          </Text>
                          {isSelected && (
                            <Ionicons name="checkmark" size={16} color="#10B981" />
                          )}
                        </TouchableOpacity>
                      );
                    }) || []}
                </View>
                {splitBillData.participants.length > 0 && (
                  <Text style={styles.selectedCount}>
                    {splitBillData.participants.length} participant{splitBillData.participants.length !== 1 ? 's' : ''} selected
                  </Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>📂 Category</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.categoryScroll}
                >
                  {[
                    'Food & Dining', 'Groceries', 'Restaurant', 'Coffee & Drinks', 'Delivery',
                    'Transportation', 'Taxi/Ride', 'Gas/Fuel', 'Parking', 'Public Transit',
                    'Entertainment', 'Movies', 'Games', 'Events', 'Concert', 'Sports',
                    'Shopping', 'Clothing', 'Electronics', 'Home Goods', 'Books',
                    'Travel', 'Flights', 'Hotel', 'Vacation', 'Accommodation',
                    'Bills & Utilities', 'Electricity', 'Water', 'Internet', 'Phone', 'Rent',
                    'Health & Fitness', 'Doctor', 'Pharmacy', 'Gym', 'Sports Equipment',
                    'Education', 'Courses', 'Books', 'School Supplies', 'Tuition',
                    'Services', 'Cleaning', 'Repair', 'Maintenance', 'Professional',
                    'Subscriptions', 'Streaming', 'Software', 'Magazines', 'Memberships',
                    'Gifts', 'Birthday', 'Holiday', 'Wedding', 'Special Occasion',
                    'Other'
                  ].map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.categoryChip,
                        splitBillData.category === cat && styles.categoryChipActive,
                      ]}
                      onPress={() => setSplitBillData(prev => ({ ...prev, category: cat }))}
                    >
                      <Text
                        style={[
                          styles.categoryText,
                          splitBillData.category === cat && styles.categoryTextActive,
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {splitBillData.amount && splitBillData.participants.length > 0 && (
                <View style={styles.splitPreview}>
                  <Text style={styles.previewTitle}>Split Preview:</Text>
                  <Text style={styles.previewText}>
                    Total: ₹{parseFloat(splitBillData.amount) || 0}
                  </Text>
                  <Text style={styles.previewText}>
                    Each person pays: ₹{((parseFloat(splitBillData.amount) || 0) / (splitBillData.participants.length + 1)).toFixed(2)}
                  </Text>
                  <Text style={styles.previewText}>
                    Participants: {splitBillData.participants
                      .filter(p => p && p.name)
                      .map(p => p.name)
                      .join(', ') || 'None selected'}
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
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
  modalTextInput: {
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
  participantsHint: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 12,
  },
  participantsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  participantChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 8,
    marginBottom: 8,
  },
  participantChipSelected: {
    backgroundColor: '#D1FAE5',
    borderColor: '#10B981',
  },
  participantAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
    marginRight: 8,
    textAlignVertical: 'center',
  },
  participantName: {
    fontSize: 14,
    color: '#64748B',
    marginRight: 8,
  },
  participantNameSelected: {
    color: '#047857',
    fontWeight: '600',
  },
  selectedCount: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
    marginTop: 8,
  },
  categoryScroll: {
    marginTop: 8,
  },
  categoryChip: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryChipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  categoryTextActive: {
    color: 'white',
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
});
