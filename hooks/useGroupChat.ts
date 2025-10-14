import { useState, useEffect, useRef, useMemo } from 'react';
import { Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useFinanceStore } from '../lib/store/financeStore';
import { socketService } from '../lib/services/socketService';
import chatAPI from '../lib/services/chatAPI';
import { groupsAPI } from '../lib/services/api';
import { Message } from '../app/types/chat';

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
    console.log('🔄 useGroupChat useEffect triggered:', {
      hasValidGroupId: !!validGroupId,
      hasCurrentUser: !!currentUser,
      groupsLength: groups.length
    });
    
    if (validGroupId && currentUser) {
      // Ensure groups are loaded before trying to access them
      if (groups.length === 0) {
        console.log('📋 Loading groups first...');
        loadGroups();
      } else {
        console.log('📨 Loading messages and connecting socket...');
        loadMessages();
        connectSocket();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [validGroupId, currentUser, groups.length]);

  // Ensure group is selected when groups are loaded
  useEffect(() => {
    if (validGroupId && typeof validGroupId === 'string' && groups.length > 0 && !currentGroup) {
      const groupToSelect = groups.find(g => g._id === validGroupId);
      if (groupToSelect) {
        selectGroup(groupToSelect);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [validGroupId, groups.length, currentGroup]);

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
        console.log('📨 Received message via socket:', {
          _id: msg._id,
          text: msg.text?.substring(0, 50),
          type: msg.type,
          user: msg.user?.name,
          hasSplitBillData: !!msg.splitBillData,
          splitBillId: msg.splitBillData?.splitBillId || msg.splitBillData?._id
        });
        
        if (msg.splitBillData) {
          console.log('📊 Split bill data in received message:', {
            splitBillId: msg.splitBillData._id || msg.splitBillData.splitBillId,
            description: msg.splitBillData.description,
            totalAmount: msg.splitBillData.totalAmount,
            participants: msg.splitBillData.participants?.length
          });
        }
        
        setMessages(prev => {
          console.log('🔍 Processing socket message:', {
            messageId: msg._id,
            currentMessagesCount: prev.length,
            messageText: msg.text?.substring(0, 30)
          });
          
          // Remove any temporary message with the same content and check for duplicates
          const filtered = prev.filter(m => !(m.isTemp && m.text === msg.text && m.user._id === msg.user._id));
          
          console.log('🔍 After filtering temps:', {
            filteredCount: filtered.length,
            removedCount: prev.length - filtered.length
          });
          
          // Check if message with same _id already exists
          const messageExists = filtered.some(m => m._id === msg._id);
          
          console.log('🔍 Duplicate check:', {
            messageExists,
            messageId: msg._id,
            existingIds: filtered.map(m => m._id).slice(-5) // Last 5 IDs
          });
          
          if (messageExists) {
            console.log('⚠️ Message already exists, skipping:', msg._id);
            return filtered; // Don't add duplicate
          }
          
          // Add the new message and sort by timestamp to maintain chronological order
          const updated = [...filtered, msg];
          const sorted = updated.sort((a, b) => {
            const timeA = new Date(a.createdAt).getTime();
            const timeB = new Date(b.createdAt).getTime();
            return timeA - timeB; // Oldest first, newest last
          });
          
          console.log('✅ Added new message, total now:', sorted.length);
          
          return sorted;
        });

        // Scroll to bottom after receiving message
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      });

      // Typing indicators handled by useTyping hook

      socketService.onMessageRead((data) => {
        setMessages(prev => prev.map(msg => {
          if (msg._id === data.messageId) {
            const readReceipt = {
              userId: data.userId,
              readAt: data.readAt ? new Date(data.readAt) : new Date()
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
        console.log('💰 Split bill updated via socket:', {
          type: data.type,
          splitBillId: data.splitBillId,
          hasSplitBill: !!data.splitBill,
          participants: data.splitBill?.participants?.length,
          timestamp: data.timestamp
        });
        
        // Log detailed participant data
        if (data.splitBill?.participants) {
          console.log('🧾 Updated participants:', data.splitBill.participants.map((p: any) => ({
            userId: p.userId,
            isPaid: p.isPaid,
            isRejected: p.isRejected,
            amount: p.amount
          })));
        }
        
        if (data.type === 'payment-made' || data.type === 'bill-rejected') {
          console.log(`🔄 Processing ${data.type} update...`);
          
          // Update messages that contain this split bill
          setMessages(prev => {
            console.log('📝 Checking', prev.length, 'messages for split bill', data.splitBillId);
            
            const updated = prev.map(msg => {
              // Check if this message contains the split bill
              const msgSplitBillId = msg.splitBillData?.splitBillId || (msg.splitBillData as any)?._id;
              const dataSplitBillId = data.splitBillId;
              
              if (msg.type === 'split_bill' && msgSplitBillId === dataSplitBillId) {
                console.log('✅ MATCH FOUND! Updating split bill message:', {
                  messageId: msg._id,
                  msgSplitBillId,
                  dataSplitBillId,
                  oldData: {
                    participants: msg.splitBillData?.participants?.map((p: any) => ({
                      userId: p.userId,
                      isPaid: p.isPaid,
                      isRejected: p.isRejected || false
                    }))
                  },
                  newData: {
                    participants: data.splitBill?.participants?.map((p: any) => ({
                      userId: p.userId,
                      isPaid: p.isPaid,
                      isRejected: p.isRejected || false
                    }))
                  }
                });
                
                // Create new split bill data object with proper structure
                const updatedSplitBillData = {
                  ...msg.splitBillData, // Keep existing fields
                  ...data.splitBill, // Merge new data
                  splitBillId: data.splitBillId, // Ensure splitBillId is set
                  _id: data.splitBillId, // Also set _id for consistency
                  participants: data.splitBill.participants // Explicitly set participants array
                };
                
                console.log('📦 New splitBillData:', {
                  splitBillId: updatedSplitBillData.splitBillId,
                  _id: updatedSplitBillData._id,
                  participantCount: updatedSplitBillData.participants?.length,
                  participants: updatedSplitBillData.participants
                });
                
                return {
                  ...msg,
                  splitBillData: updatedSplitBillData
                };
              }
              return msg;
            });
            
            const updatedCount = updated.filter((msg, idx) => msg !== prev[idx]).length;
            console.log(`🔄 Split bill update complete: ${updatedCount} message(s) updated`);
            
            if (updatedCount === 0) {
              console.warn('⚠️ No messages were updated! Split bill may not be in the current message list.');
              console.log('Looking for splitBillId:', data.splitBillId);
              console.log('Available split bill messages:', prev.filter(m => m.type === 'split_bill').map(m => ({
                id: m._id,
                splitBillId: m.splitBillData?.splitBillId
              })));
            }
            
            return updated;
          });
        } else {
          console.log('ℹ️ Ignoring split bill update type:', data.type);
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

      console.log('🔄 useGroupChat: Fetching messages for group:', groupId);
      const response = await chatAPI.getMessages(groupId);
      console.log('📥 useGroupChat: API response received:', {
        hasResponse: !!response,
        status: response?.status,
        hasData: !!response?.data,
        hasMessages: !!response?.data?.messages,
        messageCount: response?.data?.messages?.length || 0
      });

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
      console.log('✅ useGroupChat: Loaded messages from API:', {
        count: loadedMessages.length,
        firstFew: loadedMessages.slice(0, 3).map(m => ({
          _id: m._id,
          text: m.text?.substring(0, 30),
          type: m.type
        }))
      });

      // Remove duplicates from loaded messages
      const uniqueMessages = loadedMessages.filter((msg, index, arr) => 
        arr.findIndex(m => m._id === msg._id) === index
      );

      // Format loaded messages
      const formattedMessages = uniqueMessages.map(msg => ({
        ...msg,
        status: msg.status === 'error' ? 'sent' : msg.status,
        readBy: msg.readBy.map(receipt => ({
          userId: receipt.userId,
          readAt: typeof receipt.readAt === 'string' ? new Date(receipt.readAt) : receipt.readAt
        }))
      }));

      // Check if welcome message already exists in loaded messages
      const hasWelcome = formattedMessages.some(m => m._id === 'welcome');
      
      console.log('🔍 Welcome check:', { hasWelcome, loadedCount: formattedMessages.length });

      // Keep messages in chronological order (oldest first, newest last)
      // Only add welcome if it doesn't exist AND there are other messages
      const messagesToSet: Message[] = hasWelcome ? formattedMessages : [
        {
          _id: 'welcome',
          text: `Welcome to ${groupName || activeGroup?.name || 'Group Chat'}! 🎉\n\nUse commands:\n@split [description] $[amount] @user1 @user2\n@addexpense [description] $[amount]\n@predict - Get spending predictions\n@summary - View group expenses` +
          `\n\n💡 Tip: Use the "Split Bill" button for easy bill splitting!`,
          createdAt: new Date(0).toISOString(), // Use epoch time so it sorts first
          user: { _id: 'system', name: 'AI Assistant', username: 'ai', avatar: '🤖' },
          type: 'system' as const,
          status: 'sent' as const,
          groupId: groupId,
          readBy: []
        },
        ...formattedMessages
      ];
      
      console.log('💾 useGroupChat: Setting messages in state:', {
        totalMessages: messagesToSet.length,
        withoutWelcome: messagesToSet.length - 1,
        types: messagesToSet.map(m => m.type).reduce((acc, type) => {
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      });
      
      setMessages(messagesToSet);

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
        // Handle text message - just send it, backend will handle command parsing
        console.log('📤 Sending text message to API:', { groupId, text: trimmedMessage.substring(0, 30) });
        
        const response = await chatAPI.sendMessage(groupId, {
          text: trimmedMessage,
          type: 'text',
          status: 'sent'
        });

        console.log('📥 API response received:', {
          hasResponse: !!response,
          status: response?.status,
          hasMessage: !!response?.data?.message,
          messageId: response?.data?.message?._id
        });

        if (response && response.status === 'success') {
          // Update the temporary message with the real one, avoiding duplicates
          console.log('🔄 Updating temp message:', tempMessageId, '→', response.data.message._id);
          
          setMessages(prev => {
            const updated = prev.map(msg =>
              msg._id === tempMessageId ? { ...response.data.message, isTemp: false } : msg
            ).filter((msg, index, arr) => 
              // Remove any duplicates by _id, keeping the first occurrence
              arr.findIndex(m => m._id === msg._id) === index
            );
            
            console.log('✅ Message updated in state, total:', updated.length);
            return updated;
          });
        } else {
          console.log('❌ API response failed or no success status');
          // Mark message as error
          setMessages(prev => prev.map(msg =>
            msg._id === tempMessageId ? { ...msg, status: 'error' as const, isTemp: false } : msg
          ));
        }
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      Alert.alert('Error', error.message || 'Failed to send message');
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