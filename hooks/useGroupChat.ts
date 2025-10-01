import { useState, useEffect, useRef, useMemo } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams } from 'expo-router';
import { useFinanceStore } from '../lib/store/financeStore';
import { socketService } from '../lib/services/socketService';
import chatAPI from '../lib/services/chatAPI';
import { groupsAPI } from '../lib/services/api';
import { Message, ChatUser } from '../app/types/chat';
import { API_BASE_URL } from '../lib/services/api';
import { CommandParser } from '@/lib/components/CommandParser';

export const useGroupChat = () => {
  const { groupId, groupName } = useLocalSearchParams<{ groupId: string; groupName: string }>();
  const { currentUser, groups, selectGroup, selectedGroup, loadGroups } = useFinanceStore();

  // Validate groupId
  const validGroupId = groupId && groupId !== 'undefined' && groupId !== 'null' && groupId.trim() !== '' ? groupId : null;

  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSplitBillModal, setShowSplitBillModal] = useState(false);
  const [isSplitMode, setIsSplitMode] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline' | 'connecting'>('connecting');
  const [isOnline, setIsOnline] = useState(true);
  const [typingUsers, setTypingUsers] = useState<ChatUser[]>([]);

  const scrollViewRef = useRef<any>(null);

  // State to store group fetched directly from backend
  const [fetchedGroup, setFetchedGroup] = useState<any>(null);
  const [isFetchingGroup, setIsFetchingGroup] = useState(false);

  // Simplified group selection logic with fallback
  const currentGroup = useMemo(() => {
    console.log('Group selection - validGroupId:', validGroupId, 'groups length:', groups.length);
    if (!validGroupId || typeof validGroupId !== 'string') {
      console.log('Group selection - returning null: invalid groupId');
      return null;
    }

    // First try to find the group in the groups array
    const foundGroup = groups.find(g => g._id === validGroupId);
    console.log('Group selection - found in groups array:', !!foundGroup, foundGroup?.name);
    if (foundGroup) return foundGroup;

    // If not found in groups array, try selectedGroup
    console.log('Group selection - selectedGroup:', selectedGroup?.name, selectedGroup?._id);
    if (selectedGroup && selectedGroup._id === validGroupId) return selectedGroup;

    console.log('Group selection - returning null: group not found');
    return null;
  }, [validGroupId, groups, selectedGroup]);

  // Debug logging for group and members
  useEffect(() => {
    if (currentGroup) {
      console.log('Current group loaded:', {
        id: currentGroup._id,
        name: currentGroup.name,
        memberCount: currentGroup.members?.length || 0,
        members: currentGroup.members?.map((m: any) => ({
          userId: m.userId?._id,
          name: m.userId?.name,
          username: m.userId?.username,
          role: m.role
        })) || []
      });
    } else if (fetchedGroup) {
      console.log('Using fetched group:', {
        id: fetchedGroup._id,
        name: fetchedGroup.name,
        memberCount: fetchedGroup.members?.length || 0
      });
    } else {
      console.log('No current group found for groupId:', validGroupId);
      console.log('Available groups:', groups.map(g => ({ id: g._id, name: g.name })));
    }
  }, [currentGroup, fetchedGroup, validGroupId, groups]);

  // Try to fetch group directly if not found in groups array
  useEffect(() => {
    const fetchGroupDirectly = async () => {
      if (!validGroupId || typeof validGroupId !== 'string' || currentGroup || fetchedGroup || isFetchingGroup) return;

      console.log('Attempting to fetch group directly:', validGroupId);
      setIsFetchingGroup(true);

      try {
        const response = await groupsAPI.getGroup(validGroupId);
        if (response && response.data) {
          // Check if the current user is a member of this group
          const group = response.data;
          const isMember = group.members?.some((member: any) => 
            member.userId?._id === currentUser?._id && member.isActive
          );

          if (isMember) {
            setFetchedGroup(group);
            console.log('Fetched group directly and user is a member:', group.name);
          } else {
            console.log('User is not a member of group:', validGroupId);
            // Don't set the group if user is not a member
            setFetchedGroup(null);
          }
        }
      } catch (error: any) {
        console.error('Error fetching group directly:', error);
        // If we get a 403 or 404, the user probably doesn't have access
        if (error.response?.status === 403 || error.response?.status === 404) {
          console.log('User does not have access to group:', validGroupId);
        }
      } finally {
        setIsFetchingGroup(false);
      }
    };

    // Only fetch if we have messages but no group, or if groups are loaded but group not found
    const shouldFetchDirectly = validGroupId &&
      (messages.length > 0 && !currentGroup && !fetchedGroup && !isFetchingGroup) ||
      (groups.length > 0 && !currentGroup && !fetchedGroup && !isFetchingGroup);

    if (shouldFetchDirectly) {
      console.log('Triggering direct group fetch - have messages/groups but no current group');
      fetchGroupDirectly();
    }
  }, [validGroupId, currentGroup, fetchedGroup, messages.length, isFetchingGroup]);

  // Use either currentGroup or fetchedGroup
  const activeGroup = currentGroup || fetchedGroup;

  useEffect(() => {
    console.log('Messages state changed:', messages.length, 'messages');
    if (messages.length > 0) {
      console.log('Sample message:', messages[0]);
    }
  }, [messages]);

  // Load messages and connect socket when component mounts or groupId changes
  useEffect(() => {
    if (validGroupId && currentUser) {
      // Ensure groups are loaded before trying to access them
      if (groups.length === 0) {
        loadGroups();
      } else {
        loadMessages();
        connectSocket();
      }
    }
  }, [validGroupId, currentUser]);

  // Ensure group is selected when groups are loaded
  useEffect(() => {
    if (validGroupId && typeof validGroupId === 'string' && groups.length > 0 && !currentGroup) {
      const groupToSelect = groups.find(g => g._id === validGroupId);
      if (groupToSelect) {
        selectGroup(groupToSelect);
      }
    }
  }, [validGroupId, groups, currentGroup]);

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
        console.log('Received message via socket:', msg);
        setMessages(prev => {
          // Remove any temporary message with the same content and check for duplicates
          const filtered = prev.filter(m => !(m.isTemp && m.text === msg.text && m.user._id === msg.user._id));
          // Check if message with same _id already exists
          const messageExists = filtered.some(m => m._id === msg._id);
          if (messageExists) {
            return filtered; // Don't add duplicate
          }
          // Add the new message
          return [...filtered, msg];
        });

        // Scroll to bottom after receiving message
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      });

      socketService.onTypingStart((data) => {
        if (data.groupId === groupId && data.user._id !== currentUser?._id) {
          setTypingUsers(prev => {
            const user = data.user;
            if (!prev.find(u => u._id === user._id)) {
              return [...prev, user];
            }
            return prev;
          });
        }
      });

      socketService.onTypingStop((data) => {
        if (data.groupId === groupId) {
          setTypingUsers(prev => prev.filter(u => u._id !== data.user._id));
        }
      });

      socketService.onMessageRead((data) => {
        setMessages(prev => prev.map(msg => {
          if (msg._id === data.messageId) {
            const readReceipt = {
              userId: data.userId,
              readAt: new Date(data.readAt)
            };
            if (!msg.readBy.find(r => r.userId === data.userId)) {
              return { ...msg, readBy: [...msg.readBy, readReceipt] };
            }
          }
          return msg;
        }));
      });

      // Handle split bill updates
      socketService.onSplitBillUpdate((data) => {
        console.log('Split bill updated via socket:', data);
        if (data.type === 'payment-made') {
          // Update messages that contain this split bill
          setMessages(prev => prev.map(msg => {
            if (msg.type === 'split_bill' && msg.splitBillData?.splitBillId === data.splitBillId) {
              return {
                ...msg,
                splitBillData: data.splitBill
              };
            }
            return msg;
          }));
        }
      });

      socketService.onError((error) => {
        console.error('Socket error:', error);
        setConnectionStatus('offline');
        Alert.alert('Connection Error', 'Failed to connect to chat server');
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

      if (!groupId) {
        throw new Error('No group ID provided');
      }

      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const response = await chatAPI.getMessages(groupId);

      if (!response) {
        throw new Error('No response from server');
      }

      if (response.status !== 'success') {
        throw new Error(response.message || 'Failed to load messages');
      }

      if (!response.data) {
        throw new Error('No data in response');
      }

      if (!response.data.messages) {
        throw new Error('No messages in response data');
      }

      const loadedMessages = response.data.messages;

      // Remove duplicates from loaded messages
      const uniqueMessages = loadedMessages.filter((msg, index, arr) => 
        arr.findIndex(m => m._id === msg._id) === index
      );

      setMessages([
        ...uniqueMessages.map(msg => ({
          ...msg,
          status: msg.status === 'error' ? 'sent' : msg.status,
          readBy: msg.readBy.map(receipt => ({
            userId: receipt.userId,
            readAt: typeof receipt.readAt === 'string' ? new Date(receipt.readAt) : receipt.readAt
          }))
        })).reverse(),
        {
          _id: 'welcome',
          text: `Welcome to ${groupName || activeGroup?.name || 'Group Chat'}! 🎉\n\nUse commands:\n@split [description] $[amount] @user1 @user2\n@addexpense [description] $[amount]\n@predict - Get spending predictions\n@summary - View group expenses` +
          `\n\n💡 Tip: Use the "Split Bill" button for easy bill splitting!`,
          createdAt: new Date().toISOString(),
          user: { _id: 'system', name: 'AI Assistant', username: 'ai', avatar: '🤖' },
          type: 'system',
          status: 'sent',
          groupId: groupId,
          readBy: []
        }
      ]);

      // Scroll to bottom after loading messages
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error: any) {
      console.error('Error loading messages:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to load messages. Please try again.';
      Alert.alert('Error', errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (messageText?: string, mediaData?: {
    uri: string;
    type: 'image' | 'video' | 'audio' | 'document';
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
  }) => {
    const textToSend = messageText || message;
    if ((!textToSend.trim() && !mediaData) || !currentUser || !groupId) return;

    const trimmedMessage = textToSend.trim();

    // Only clear the input if we're sending the current message
    if (!messageText) {
      setMessage('');
    }

    try {
      // Create the message object immediately for local state
      const tempMessageId = `temp-${Date.now()}-${Math.random()}`;
      const messageToAdd: Message = {
        _id: tempMessageId,
        text: trimmedMessage,
        createdAt: new Date().toISOString(),
        user: {
          _id: currentUser._id,
          name: currentUser.name || 'Unknown',
          username: currentUser.username || 'unknown',
          avatar: currentUser.avatar || currentUser.name?.charAt(0).toUpperCase()
        },
        type: mediaData ? mediaData.type : 'text',
        status: 'sent' as const,
        readBy: [] as { userId: string; readAt: Date }[],
        groupId: groupId,
        isTemp: true,
        // Add multimedia fields if present
        ...(mediaData && {
          mediaUrl: '', // Will be set by server
          mediaType: mediaData.type,
          mediaSize: mediaData.fileSize,
          fileName: mediaData.fileName,
          mimeType: mediaData.mimeType,
        })
      };

      // Immediately add message to local state (WhatsApp-like behavior)
      setMessages(prev => [...prev, messageToAdd]);

      // Scroll to bottom to show the new message
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);

      if (mediaData) {
        // Handle multimedia upload
        try {
          let uploadResponse;
          switch (mediaData.type) {
            case 'image':
              uploadResponse = await chatAPI.uploadImage(groupId, {
                uri: mediaData.uri,
                type: mediaData.mimeType,
                name: mediaData.fileName,
              }, trimmedMessage);
              break;
            case 'video':
              uploadResponse = await chatAPI.uploadVideo(groupId, {
                uri: mediaData.uri,
                type: mediaData.mimeType,
                name: mediaData.fileName,
              }, trimmedMessage);
              break;
            case 'audio':
              uploadResponse = await chatAPI.uploadAudio(groupId, {
                uri: mediaData.uri,
                type: mediaData.mimeType,
                name: mediaData.fileName,
              }, trimmedMessage);
              break;
            case 'document':
              uploadResponse = await chatAPI.uploadDocument(groupId, {
                uri: mediaData.uri,
                type: mediaData.mimeType,
                name: mediaData.fileName,
              }, trimmedMessage);
              break;
            default:
              throw new Error('Unsupported media type');
          }

          if (uploadResponse && uploadResponse.status === 'success') {
            // Update the temporary message with the real one
            setMessages(prev => prev.map(msg =>
              msg._id === tempMessageId ? { ...uploadResponse.data.message, isTemp: false } : msg
            ).filter((msg, index, arr) => 
              // Remove any duplicates by _id, keeping the first occurrence
              arr.findIndex(m => m._id === msg._id) === index
            ));
          } else {
            // Mark message as error
            setMessages(prev => prev.map(msg =>
              msg._id === tempMessageId ? { ...msg, status: 'error' as const, isTemp: false } : msg
            ));
          }
        } catch (uploadError: any) {
          console.error('Error uploading media:', uploadError);
          // Mark message as error
          setMessages(prev => prev.map(msg =>
            msg._id === tempMessageId ? { ...msg, status: 'error' as const, isTemp: false } : msg
          ));
          Alert.alert('Upload Error', uploadError.message || 'Failed to upload media');
        }
      } else {
        // Handle text message
        // Check if the message is a command
        const commandData = CommandParser.parse(trimmedMessage);
        if (commandData && commandData.type !== 'unknown') {
          await processCommand(commandData, trimmedMessage);
        } else {
          // Send regular text message
          const response = await chatAPI.sendMessage(groupId, {
            text: trimmedMessage,
            type: 'text',
            status: 'sent'
          });

          if (response && response.status === 'success') {
            // Update the temporary message with the real one, avoiding duplicates
            setMessages(prev => prev.map(msg =>
              msg._id === tempMessageId ? { ...response.data.message, isTemp: false } : msg
            ).filter((msg, index, arr) => 
              // Remove any duplicates by _id, keeping the first occurrence
              arr.findIndex(m => m._id === msg._id) === index
            ));
          } else {
            // Mark message as error
            setMessages(prev => prev.map(msg =>
              msg._id === tempMessageId ? { ...msg, status: 'error' as const, isTemp: false } : msg
            ));
          }
        }
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      Alert.alert('Error', error.message || 'Failed to send message');
    }
  };

  const processCommand = async (commandData: any, originalMessage: string) => {
    try {
      console.log('Processing command:', commandData.type, 'with data:', commandData);

      switch (commandData.type) {
        case 'split':
          await handleSplitBillCommand(commandData);
          break;
        case 'expense':
          await handleExpenseCommand(commandData);
          break;
        case 'predict':
          await handlePredictCommand();
          break;
        case 'summary':
          await handleSummaryCommand();
          break;
        case 'unknown':
          console.log('Unknown command type, will be sent as regular message');
          // This will be handled as a regular message in sendMessage
          break;
      }
    } catch (error: any) {
      console.error('Error processing command:', commandData?.type, error);
      console.error('Command data:', commandData);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        response: error.response?.data,
        status: error.response?.status
      });

      // Show user-friendly error message
      const errorMessage = error.message || `Failed to process ${commandData?.type || 'command'}`;
      Alert.alert('Command Error', errorMessage);
    }
  };

  const handleSplitBillCommand = async (data: any) => {
    console.log('handleSplitBillCommand called with data:', data);
    console.log('Data type checks:', {
      data: !!data,
      dataAmount: !!data?.amount,
      dataAmountValue: data?.amount,
      dataAmountType: typeof data?.amount,
      amountGreaterThanZero: data?.amount > 0
    });

    try {
      if (!data || !data.amount || data.amount <= 0) {
        throw new Error('Invalid amount for split bill');
      }

      if (!currentUser?._id) {
        throw new Error('User not authenticated');
      }

      if (!validGroupId) {
        throw new Error('No group selected');
      }

      // Handle both old and new command formats
      let participants = [];
      let description = data.description || 'Split Bill';

      if (data.username) {
        // Old format: @split description $amount @username
        const member = activeGroup?.members?.find((m: any) =>
          m.userId?.username === data.username.replace('@', '')
        );
        if (member) {
          participants = [{
            userId: member.userId._id,
            name: member.userId.name || data.username
          }];
        } else {
          throw new Error(`User @${data.username} not found in this group`);
        }
      } else if (data.participants && data.participants.length > 0) {
        // New format: @split description $amount @user1 @user2
        participants = data.participants.map((username: string) => {
          // Find user by username in group members
          const member = activeGroup?.members?.find((m: any) =>
            m.userId?.username === username.replace('@', '')
          );
          if (member) {
            return {
              userId: member.userId._id,
              name: member.userId.name || username
            };
          } else {
            throw new Error(`User ${username} not found in this group`);
          }
        }).filter((p: any) => p.userId); // Filter out any invalid entries
      } else {
        // Default: split with all group members except current user
        participants = activeGroup?.members
          ?.filter((member: any) => member?.userId && member.userId._id !== currentUser._id)
          ?.map((member: any) => ({
            userId: member.userId._id,
            name: member.userId.name || 'Unknown'
          })) || [];
      }

      if (participants.length === 0) {
        throw new Error('No participants found for split bill');
      }

      // Create the split bill
      const splitBillData = {
        description: description,
        totalAmount: data.amount,
        groupId: validGroupId,
        participants: participants,
        splitType: 'equal' as const,
        category: data.category || 'Split',
        currency: 'INR'
      };

      console.log('Creating split bill with data:', splitBillData);
      const result = await useFinanceStore.getState().createSplitBill(splitBillData);

      // Create individual expenses for each participant (only for valid user IDs)
      for (const participant of participants) {
        // Skip if userId is not a valid ObjectId (e.g., username string)
        if (!participant.userId || typeof participant.userId !== 'string' || participant.userId.length !== 24) {
          console.warn('Skipping expense creation for invalid userId:', participant.userId);
          continue;
        }

        const expenseData = {
          description: `${description} (split with ${participants.length} people)`,
          amount: data.amount / participants.length,
          category: data.category || 'Split',
          userId: participant.userId,
          groupId: validGroupId
        };

        try {
          await useFinanceStore.getState().addExpense(expenseData);
        } catch (expenseError) {
          console.error('Error creating individual expense for participant:', participant, expenseError);
          // Continue with other participants even if one fails
        }
      }

      // Send confirmation message
      const participantNames = participants
        .filter((p: any) => p.userId !== currentUser._id)
        .map((p: any) => p.name)
        .join(', ');

      const confirmationMessage = `✅ Split bill created!\n📝 ${description}\n💰 Total: $${(data.amount || 0).toFixed(2)}\n🤝 Each pays: $${((data.amount || 0) / participants.length).toFixed(2)}\n👥 Participants: ${participantNames || 'All group members'}\n💾 Data saved to database`;

      await sendMessage(confirmationMessage);

      Alert.alert('Success', 'Split bill created successfully and expenses added to database!');
    } catch (error: any) {
      console.error('Error creating split bill:', error);
      Alert.alert('Error', error.message || 'Failed to create split bill');
    }
  };

  const handleExpenseCommand = async (data: any) => {
    try {
      if (!data || !data.amount || data.amount <= 0) {
        throw new Error('Invalid amount for expense');
      }

      if (!currentUser?._id) {
        throw new Error('User not authenticated');
      }

      // Create expense data
      const expenseData = {
        description: data.description,
        amount: data.amount,
        category: data.category,
        userId: currentUser._id,
        groupId: validGroupId || undefined
      };

      // Add the expense
      const { addExpense } = useFinanceStore.getState();
      await addExpense(expenseData);

      // Send confirmation message
      const confirmationMessage = `✅ Expense added!\n📝 ${data.description}\n💰 Amount: $${(data.amount || 0).toFixed(2)}\n📂 Category: ${data.category}`;
      await sendMessage(confirmationMessage);

      Alert.alert('Success', 'Expense added successfully!');
    } catch (error: any) {
      console.error('Error adding expense:', error);
      Alert.alert('Error', error.message || 'Failed to add expense');
    }
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
        throw new Error('Failed to get predictions');
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
        groupId: groupId!,
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
        throw new Error('Failed to get summary');
      }

      const data = await response.json();
      console.log('AI summary response:', data);

      // Create AI response message
      const aiMessage: Message = {
        _id: `ai-${Date.now()}`,
        text: `📊 Financial Summary:\n\n💰 Total Expenses: $${data.totalExpenses?.toFixed(2) || '0.00'}\n💵 Personal: $${data.totalPersonalExpenses?.toFixed(2) || '0.00'}\n🤝 Split Bills: $${data.totalSplitExpenses?.toFixed(2) || '0.00'}\n\n📈 Expense Count: ${data.expenseCount || 0}\n🔄 Split Bills: ${data.splitBillCount || 0}\n\n📂 Top Categories:\n${Object.entries(data.categoryBreakdown || {}).map(([cat, amount]: [string, any]) =>
          `• ${cat}: $${Number(amount).toFixed(2)}`
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
        groupId: groupId!,
        isTemp: false
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error handling summary command:', error);
      Alert.alert('Error', 'Failed to get financial summary. Please try again.');
    }
  };

  return {
    // State
    message,
    setMessage,
    messages,
    isLoading,
    showSplitBillModal,
    setShowSplitBillModal,
    isSplitMode,
    setIsSplitMode,
    connectionStatus,
    isOnline,
    validGroupId,
    activeGroup,
    scrollViewRef,

    // Actions
    sendMessage,
    loadMessages,
    connectSocket
  };
};