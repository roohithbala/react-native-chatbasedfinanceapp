import React, { useEffect, useState } from 'react';
import {
  View,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StatusBar,
  Alert,
  ActionSheetIOS,
  Modal,
  TouchableOpacity as TouchableOpacityRN,
  Text as TextRN,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useTheme } from '../context/ThemeContext';
import getStyles from '@/lib/styles/chatStyles';
import ChatHeader from './components/ChatHeader';
import ChatMessages from './components/ChatMessages';
import MessageInput from '../components/MessageInput';
import { MediaViewer } from '../components/MediaViewer';
import { useChatStore } from '@/lib/store/chatStore';
import { chatAPIService } from '@/lib/services/ChatAPIService';
import { directMessagesAPI } from '@/lib/services/api';
import { socketService } from '../lib/services/socketService';
import { useDirectChatCommands } from '@/lib/hooks/useDirectChatCommands';
import { useProfileData } from '@/hooks/useProfileData';
import UpiIdInputModal from '../components/UpiIdInputModal';
import SplitBillModal from '../components/SplitBillModal';

export default function ChatDetailScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const { messages, isLoading, loadMessages, sendMessage } = useChatStore();
  const { currentUser } = useProfileData();
  const [newMessage, setNewMessage] = useState('');
  const [otherUser, setOtherUser] = useState<any | null>(null);
  const [mediaViewerVisible, setMediaViewerVisible] = useState(false);
  const [selectedMediaForViewer, setSelectedMediaForViewer] = useState<any | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showUpiModal, setShowUpiModal] = useState(false);
  const [paymentData, setPaymentData] = useState<{
    splitBill: any;
    userShare: number;
  } | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<{
    uri: string;
    type: 'image' | 'video' | 'audio' | 'document';
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
  } | null>(null);
  const [latestSplitBill, setLatestSplitBill] = useState<any>(null);
  const [showSplitBillModal, setShowSplitBillModal] = useState(false);

  // Use command handler for direct chats
  const { handleSendMessage } = useDirectChatCommands({
    currentUser,
    otherUser,
    userId,
    sendMessage,
    onShowPaymentOptions: (splitBill, userShare) => {
      setPaymentData({ splitBill, userShare });
      setShowUpiModal(true);
    },
    onSplitBillCreated: (splitBill) => {
      setLatestSplitBill(splitBill);
    },
  });

  useEffect(() => {
    const loadChatData = async () => {
      if (userId) {
        try {
          console.log('🔵 Loading chat with:', {
            otherUserId: userId,
            currentUserId: currentUser?._id,
            currentUserName: currentUser?.name || currentUser?.username
          });

          // Load messages
          await loadMessages(userId, true); // true for direct chat
          
          // Mark messages as read when opening chat
          try {
            await directMessagesAPI.markAsRead(userId);
            console.log('✅ Marked messages as read for user:', userId);
          } catch (error) {
            console.error('Failed to mark messages as read:', error);
          }
          
          // Load user data for header
          const userData = await chatAPIService.getUserById(userId);
          setOtherUser({
            _id: userData._id,
            name: userData.name,
            username: userData.username,
            avatar: userData.avatar || userData.name?.charAt(0)?.toUpperCase() || '👤'
          });

          console.log('👤 Other user loaded:', {
            _id: userData._id,
            name: userData.name,
            username: userData.username
          });

          // Connect to socket for real-time messaging
          await socketService.connect();
          console.log('🔌 Socket connected successfully');
          
          // Join both user rooms for direct messaging
          socketService.joinUserRoom(userId); // Join other user's room
          console.log('🔌 Joined other user room:', userId);
          
          if (currentUser?._id) {
            socketService.joinUserRoom(currentUser._id); // Join own room to receive messages
            console.log('🔌 Joined own user room:', currentUser._id);
          }
          
          // Listen for new messages
          socketService.onNewMessage((message: any) => {
            console.log('📥 Received socket message in chat screen:', message);
            
            // Check if this message belongs to this chat
            const senderId = message.sender?._id || message.sender;
            const receiverId = message.receiver?._id || message.receiver;
            const isFromCurrentUser = senderId === currentUser?._id;
            const chatPartnerId = isFromCurrentUser ? receiverId : senderId;
            
            console.log('🔍 Message routing:', { 
              senderId, 
              receiverId, 
              currentUserId: currentUser?._id, 
              userId, 
              chatPartnerId,
              matches: chatPartnerId === userId 
            });
            
            if (chatPartnerId === userId) {
              // This message belongs to this chat, update the store
              const { messages } = useChatStore.getState();
              const existingMessages = messages[userId] || [];
              const messageExists = existingMessages.some(m => m._id === message._id);
              
              if (!messageExists) {
                // Format the message to match our Message type
                const formattedMessage = {
                  ...message,
                  _id: message._id,
                  text: message.text,
                  createdAt: message.createdAt,
                  user: message.sender,
                  type: message.type || 'text',
                  status: message.status || 'sent',
                  splitBillData: message.splitBillData,
                  readBy: message.readBy || [],
                };

                console.log('✅ Adding message to store:', formattedMessage);
                
                useChatStore.setState(state => ({
                  messages: {
                    ...state.messages,
                    [userId]: [...existingMessages, formattedMessage]
                  }
                }));
              }
            }
          });

          // Listen for message deletions
          socketService.onMessageDeleted((data: { messageId: string; userId: string }) => {
            console.log('📥 Message deleted event:', data);
            
            if (data.userId === userId) {
              // Remove the deleted message from the store
              const { messages } = useChatStore.getState();
              const existingMessages = messages[userId] || [];
              
              useChatStore.setState(state => ({
                messages: {
                  ...state.messages,
                  [userId]: existingMessages.filter(m => m._id !== data.messageId)
                }
              }));
            }
          });

          // Listen for split bill updates (payment, rejection, etc.)
          socketService.onSplitBillUpdate((data: any) => {
            console.log('📥 Split bill update event received:', {
              splitBillId: data.splitBillId,
              type: data.type,
              hasParticipants: !!data.splitBill?.participants,
              participantsCount: data.splitBill?.participants?.length,
              participants: data.splitBill?.participants
            });
            
            if (data.splitBillId) {
              // Refresh messages from backend to get latest split bill data
              console.log('� Socket event received, force-refreshing messages from backend');
              loadMessages(userId, true);
            } else {
              console.log('⚠️ No splitBillId in socket event data');
            }
          });
        } catch (err) {
          console.error('Failed to load chat data:', err);
        }
      }
    };

    loadChatData();

    // Cleanup function to disconnect socket when leaving chat
    return () => {
      if (userId) {
        socketService.leaveUserRoom(userId);
      }
      socketService.offMessageDeleted();
      socketService.offSplitBillUpdate();
      socketService.disconnect();
    };
  }, [userId, loadMessages, currentUser?._id, currentUser?.name, currentUser?.username]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    try {
      await handleSendMessage(newMessage);
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleHamburgerMenu = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['View Profile', 'Clear Chat', 'Block User', 'Report User', 'Cancel'],
          destructiveButtonIndex: 2,
          cancelButtonIndex: 4,
        },
        (buttonIndex) => {
          handleMenuAction(buttonIndex);
        }
      );
    } else {
      // For Android, show a simple modal menu
      setShowMenu(true);
    }
  };

  const handleMenuAction = async (buttonIndex: number) => {
    if (!userId || !otherUser) return;

    try {
      switch (buttonIndex) {
        case 0: // View Profile
          Alert.alert('View Profile', `Profile: ${otherUser.name}\nUsername: ${otherUser.username}`);
          break;

        case 1: // Clear Chat
          Alert.alert(
            'Clear Chat',
            'Are you sure you want to clear this chat? This action cannot be undone.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Clear',
                style: 'destructive',
                onPress: async () => {
                  try {
                    await chatAPIService.clearChat(userId);
                    // Clear messages from local store
                    // Note: This would need to be implemented in the chat store
                    Alert.alert('Success', 'Chat history has been cleared.');
                  } catch {
                    Alert.alert('Error', 'Failed to clear chat. Please try again.');
                  }
                }
              }
            ]
          );
          break;

        case 2: // Block User
          Alert.alert(
            'Block User',
            `Are you sure you want to block ${otherUser.name}? You won't be able to send or receive messages from this user.`,
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Block',
                style: 'destructive',
                onPress: async () => {
                  try {
                    await chatAPIService.blockUser(userId);
                    Alert.alert('Success', `${otherUser.name} has been blocked.`);
                  } catch {
                    Alert.alert('Error', 'Failed to block user. Please try again.');
                  }
                }
              }
            ]
          );
          break;

        case 3: // Report User
          Alert.alert(
            'Report User',
            'Please select a reason for reporting this user:',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Harassment',
                onPress: () => submitReport('Harassment')
              },
              {
                text: 'Spam',
                onPress: () => submitReport('Spam')
              },
              {
                text: 'Inappropriate Content',
                onPress: () => submitReport('Inappropriate Content')
              },
              {
                text: 'Other',
                onPress: () => submitReport('Other')
              }
            ]
          );
          break;
      }
    } catch {
      console.error('Menu action error');
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    }
  };

  const submitReport = async (reason: string) => {
    if (!userId || !otherUser) return;

    try {
      await chatAPIService.reportUser({
        reportedUserId: userId,
        reportedUsername: otherUser.username,
        reason: reason,
        description: `Reported from chat by ${currentUser?.name || 'User'}`
      });
      Alert.alert('Success', 'Report submitted successfully. Our team will review this report.');
    } catch {
      Alert.alert('Error', 'Failed to submit report. Please try again.');
    }
  };

  const handleUpiPayment = async (upiId: string) => {
    if (!paymentData) return;

    try {
      Alert.alert(
        'Processing Payment',
        'Please wait while we process your BHIM UPI payment...',
        [],
        { cancelable: false }
      );

      const { splitBill, userShare } = paymentData;
      const paymentDataObj = {
        amount: userShare,
        currency: 'INR',
        description: `Payment for: ${splitBill.description}`,
        upiId: upiId,
        recipientId: splitBill.participants.find((p: any) => p.userId !== currentUser?._id)?.userId,
        splitBillId: splitBill._id,
      };

      const bhimUpiService = (await import('@/lib/services/bhimUpiService')).default;
      const result = await bhimUpiService.processPayment(paymentDataObj);

      if (result.success) {
        // Mark the bill as paid after successful UPI payment
        const { markSplitBillAsPaid } = (await import('@/lib/store/financeStore')).useFinanceStore.getState();
        await markSplitBillAsPaid(splitBill._id);

        Alert.alert(
          'Payment Successful!',
          `Payment of ₹${userShare.toFixed(2)} completed successfully!\nTransaction ID: ${result.transactionId}`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Payment Failed', result.error || 'Payment could not be processed. Please try again.');
      }
    } catch (error: any) {
      console.error('BHIM UPI payment error:', error);
      Alert.alert('Payment Error', error.message || 'An unexpected error occurred during payment.');
    } finally {
      setPaymentData(null);
    }
  };

  const handleSplitBillPress = () => {
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
    if (!selectedMedia || !userId) return;

    try {
      // Create file object from selected media
      const fileUri = selectedMedia.uri;
      const fileName = selectedMedia.fileName || fileUri.split('/').pop() || 'file';
      const fileType = selectedMedia.mimeType || selectedMedia.type;

      const file = {
        uri: fileUri,
        type: fileType,
        name: fileName,
      };

      // Upload the media file to backend using the correct method
      switch (selectedMedia.type) {
        case 'image':
          await chatAPIService.uploadImage(userId, file, undefined, true, userId);
          break;
        case 'video':
          await chatAPIService.uploadVideo(userId, file, undefined, true, userId);
          break;
        case 'audio':
          await chatAPIService.uploadAudio(userId, file, undefined, true, userId);
          break;
        case 'document':
          await chatAPIService.uploadDocument(userId, file, undefined, true, userId);
          break;
        default:
          throw new Error('Unsupported media type');
      }
      
      // The backend already creates the message and emits socket event
      // The socket will handle real-time updates, but let's also refresh messages to be safe
      await loadMessages(userId, true);
      
      setSelectedMedia(null);
    } catch (error) {
      console.error('Failed to send media:', error);
      Alert.alert('Error', 'Failed to send media. Please try again.');
    }
  };

  const handleMediaCancel = () => {
    setSelectedMedia(null);
  };

  const handleSplitBillCreated = (splitBill: any) => {
    console.log('🎫 Split bill created, sending to chat:', {
      splitBillId: splitBill._id,
      description: splitBill.description,
      createdBy: splitBill.createdBy,
      participants: splitBill.participants,
      hasCreatedBy: !!splitBill.createdBy,
      createdById: splitBill.createdBy?._id,
      participantsCount: splitBill.participants?.length
    });
    
    // Format the split bill data properly for the message
    const formattedSplitBillData = {
      _id: splitBill._id,
      description: splitBill.description,
      totalAmount: splitBill.totalAmount,
      createdBy: splitBill.createdBy || {
        _id: currentUser?._id,
        name: currentUser?.name || currentUser?.username,
        avatar: currentUser?.avatar
      },
      participants: splitBill.participants.map((p: any) => ({
        userId: typeof p.userId === 'object' ? p.userId._id || p.userId : p.userId,
        amount: p.amount,
        isPaid: p.isPaid || false,
        isRejected: p.isRejected || false,
        paidAt: p.paidAt,
        rejectedAt: p.rejectedAt
      })),
      splitType: splitBill.splitType,
      category: splitBill.category,
      isSettled: splitBill.isSettled || false
    };
    
    // Send a split bill request message to the chat with formatted data
    sendMessage(userId, `✅ Split bill created: ${splitBill.description}`, true, 'split_bill', formattedSplitBillData);
    setLatestSplitBill(formattedSplitBillData);
  };

  const handleDeleteMessage = (messageId: string) => {
    // Remove message from local state
    const { messages } = useChatStore.getState();
    const existingMessages = messages[userId] || [];
    
    useChatStore.setState(state => ({
      messages: {
        ...state.messages,
        [userId]: existingMessages.filter(m => m._id !== messageId)
      }
    }));
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.primary} />

      <ChatHeader
        otherUser={otherUser}
        theme={theme}
        onHamburger={handleHamburgerMenu}
        onVoiceCall={() => router.push(`/voice-call/${userId}?type=personal`) }
        onVideoCall={() => router.push(`/video-call/${userId}?type=personal`) }
      />

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ChatMessages
          messages={messages[userId] || []}
          currentUserId={currentUser?._id}
          theme={theme}
          onRetryImage={() => {}}
          onOpenMedia={(mediaUrl, mediaType, fileName) => {
            if (mediaUrl && mediaType) {
              setSelectedMediaForViewer({ mediaUrl, mediaType, fileName });
              setMediaViewerVisible(true);
            }
          }}
          onSplitBillUpdate={async () => {
            // Refresh messages to show updated split bill status
            console.log('🔄 onSplitBillUpdate called, refreshing messages...');
            await loadMessages(userId, true);
            console.log('✅ Messages refreshed after split bill update');
          }}
          latestSplitBill={latestSplitBill}
          onDeleteMessage={handleDeleteMessage}
        />

        <MessageInput
          message={newMessage}
          onMessageChange={setNewMessage}
          onSendPress={handleSend}
          onSplitBillPress={handleSplitBillPress}
          onMediaSelect={handleMediaSelect}
          selectedMedia={selectedMedia}
          onMediaSend={handleMediaSend}
          onMediaCancel={handleMediaCancel}
          groupId={undefined}
          activeGroup={undefined}
          isDirectChat={true}
          otherUser={otherUser}
          onUserMention={() => {}}
        />
      </KeyboardAvoidingView>

      <MediaViewer
        visible={mediaViewerVisible}
        mediaUrl={selectedMediaForViewer?.mediaUrl || null}
        mediaType={selectedMediaForViewer?.mediaType || null}
        fileName={selectedMediaForViewer?.fileName}
        onClose={() => { setMediaViewerVisible(false); setSelectedMediaForViewer(null); }}
        onDownload={() => {}}
      />

      {/* Android Menu Modal */}
      <Modal
        visible={showMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableOpacityRN
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        >
          <View style={{
            backgroundColor: theme.surface,
            borderRadius: 12,
            padding: 20,
            width: '80%',
            maxWidth: 300,
          }}>
            <TextRN style={{
              fontSize: 18,
              fontWeight: '600',
              color: theme.text,
              marginBottom: 20,
              textAlign: 'center',
            }}>
              Chat Options
            </TextRN>

            <TouchableOpacityRN
              style={{
                paddingVertical: 15,
                borderBottomWidth: 1,
                borderBottomColor: theme.surfaceSecondary,
              }}
              onPress={() => {
                setShowMenu(false);
                handleMenuAction(0); // View Profile
              }}
            >
              <TextRN style={{ fontSize: 16, color: theme.text }}>View Profile</TextRN>
            </TouchableOpacityRN>

            <TouchableOpacityRN
              style={{
                paddingVertical: 15,
                borderBottomWidth: 1,
                borderBottomColor: theme.surfaceSecondary,
              }}
              onPress={() => {
                setShowMenu(false);
                handleMenuAction(1); // Clear Chat
              }}
            >
              <TextRN style={{ fontSize: 16, color: theme.text }}>Clear Chat</TextRN>
            </TouchableOpacityRN>

            <TouchableOpacityRN
              style={{
                paddingVertical: 15,
                borderBottomWidth: 1,
                borderBottomColor: theme.surfaceSecondary,
              }}
              onPress={() => {
                setShowMenu(false);
                handleMenuAction(2); // Block User
              }}
            >
              <TextRN style={{ fontSize: 16, color: theme.error }}>Block User</TextRN>
            </TouchableOpacityRN>

            <TouchableOpacityRN
              style={{
                paddingVertical: 15,
              }}
              onPress={() => {
                setShowMenu(false);
                handleMenuAction(3); // Report User
              }}
            >
              <TextRN style={{ fontSize: 16, color: theme.error }}>Report User</TextRN>
            </TouchableOpacityRN>
          </View>
        </TouchableOpacityRN>
      </Modal>

      {/* UPI Payment Modal */}
      <UpiIdInputModal
        visible={showUpiModal}
        onClose={() => {
          setShowUpiModal(false);
          setPaymentData(null);
        }}
        onSubmit={handleUpiPayment}
        amount={paymentData?.userShare || 0}
        description={`Payment for: ${paymentData?.splitBill?.description || ''}`}
      />

      {/* Split Bill Modal */}
      <SplitBillModal
        visible={showSplitBillModal}
        onClose={() => setShowSplitBillModal(false)}
        groupId={null} // Direct chat, no group
        groupMembers={otherUser ? [{
          userId: otherUser._id,
          name: otherUser.name,
          username: otherUser.username
        }] : []}
        onSplitBillCreated={handleSplitBillCreated}
      />
    </SafeAreaView>
  );
}
