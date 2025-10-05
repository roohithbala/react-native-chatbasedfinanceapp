import React, { useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useTheme } from '../context/ThemeContext';
import SplitBillMessage from './SplitBillMessage';

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
  type?: 'text' | 'image' | 'video' | 'audio' | 'document' | 'system' | 'command' | 'split_bill';
  status?: 'sent' | 'delivered' | 'read' | 'error';
  // Multimedia fields
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'audio' | 'document';
  mediaSize?: number;
  mediaDuration?: number;
  mediaWidth?: number;
  mediaHeight?: number;
  thumbnailUrl?: string;
  fileName?: string;
  mimeType?: string;
  mentions?: string[];
  reactions?: any[];
  isTemp?: boolean;
}

interface ChatMessagesListProps {
  messages: Message[];
  currentUserId?: string;
  isLoading?: boolean;
  onMessagePress?: (message: Message) => void;
  onMediaPress?: (mediaUrl: string, mediaType: string) => void;
  onPayBill?: (splitBillId: string) => void;
  onViewSplitBillDetails?: (splitBillId: string) => void;
  onPaymentSuccess?: () => void;
}

export default function ChatMessagesList({
  messages,
  currentUserId,
  isLoading = false,
  onMessagePress,
  onMediaPress,
  onPayBill,
  onViewSplitBillDetails,
  onPaymentSuccess,
}: ChatMessagesListProps) {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const flatListRef = useRef<FlatList>(null);

  const renderMessage = ({ item }: { item: Message }) => {
    if (!item || !item.sender) {
      console.warn('Invalid message object:', item);
      return null;
    }

    if (!currentUserId) {
      console.warn('Current user not available for message rendering');
      return null;
    }

    const isOwnMessage = item.sender._id === currentUserId;

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

            const currentUserShare = transformedParticipants.find(p => p.userId === currentUserId)?.amount || 0;
            const currentUserPaid = transformedParticipants.find(p => p.userId === currentUserId)?.isPaid || false;

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
                currentUserId={currentUserId}
                messageId={item._id}
                canReject={false}
                onPaymentSuccess={onPaymentSuccess}
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
        <Text style={[styles.loadingText, { color: theme.textSecondary || '#6B7280' }]}>
          Loading messages...
        </Text>
      </View>
    );
  }

  if (messages.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="chatbubble-outline" size={64} color="#CBD5E1" />
        <Text style={[styles.emptyTitle, { color: theme.text }]}>
          No messages yet
        </Text>
        <Text style={[styles.emptySubtitle, { color: theme.textSecondary || '#64748B' }]}>
          Start the conversation by sending a message
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      ref={flatListRef}
      data={messages}
      renderItem={renderMessage}
      keyExtractor={(item) => item._id}
      contentContainerStyle={styles.messageList}
      showsVerticalScrollIndicator={false}
      onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
      inverted={false}
    />
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: theme.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
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
    lineHeight: 22,
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
});