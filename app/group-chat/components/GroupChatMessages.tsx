import React, { useRef, useEffect } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Message } from '@/app/types/chat';
import GroupMessageItem from './GroupMessageItem';
import TypingIndicator from '../../components/TypingIndicator';

interface GroupChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
  typingUsers: any[];
  currentUser: any;
  loadMessages: () => void;
  theme: any;
}

export default function GroupChatMessages({
  messages,
  isLoading,
  typingUsers,
  currentUser,
  loadMessages,
  theme,
}: GroupChatMessagesProps) {
  const scrollViewRef = useRef<ScrollView>(null);

  // Debug: Log component render with message count
  console.log('📱 GroupChatMessages rendering:', {
    messageCount: messages.length,
    isLoading,
    hasCurrentUser: !!currentUser,
    firstMessage: messages[0] ? {
      _id: messages[0]._id,
      text: messages[0].text?.substring(0, 30)
    } : null,
    lastMessage: messages[messages.length - 1] ? {
      _id: messages[messages.length - 1]._id,
      text: messages[messages.length - 1].text?.substring(0, 30)
    } : null
  });

  const renderMessage = (msg: Message, index: number) => {
    if (!msg || !msg.user) {
      console.warn('❌ Invalid message object at index', index, ':', msg);
      return null;
    }

    if (!currentUser) {
      console.warn('❌ Current user not available for message rendering');
      return null;
    }

    const isOwnMessage = msg.user._id === currentUser._id;
    
    // Debug: Log every 10th message to see what's being rendered
    if (index % 10 === 0) {
      console.log(`✅ Rendering message ${index}/${messages.length}:`, {
        _id: msg._id,
        type: msg.type,
        text: msg.text?.substring(0, 50)
      });
    }

    // Generate a unique key that includes split bill status to force re-render on updates
    const splitBillKey = msg.splitBillData ? 
      `-${JSON.stringify(msg.splitBillData.participants?.map((p: any) => `${p.userId}:${p.isPaid}:${p.isRejected}`).join(','))}` : 
      '';
    
    return (
      <GroupMessageItem
        key={`${msg._id}-${msg.createdAt}-${index}${splitBillKey}`}
        item={msg}
        isOwnMessage={isOwnMessage}
        theme={theme}
        onRetryImage={(id) => {
          console.log('Retry image:', id);
        }}
        onOpenMedia={(mediaUrl, mediaType, fileName) => {
          console.log('Open media:', mediaUrl, mediaType, fileName);
          // TODO: Implement media viewer
        }}
        currentUserId={currentUser._id}
        onSplitBillUpdate={() => loadMessages()}
        senderName={!isOwnMessage ? msg.user.name : undefined}
      />
    );
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 150);
    }
  }, [messages.length]);

  return (
    <View style={{
      flex: 1,
      paddingHorizontal: 16,
    }}>
      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingVertical: 16,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <Text style={{
              fontSize: 16,
              color: theme.textSecondary || '#6B7280',
            }}>
              Loading messages...
            </Text>
          </View>
        ) : messages.length === 0 ? (
          <View style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 32,
          }}>
            <Ionicons name="chatbubble-ellipses" size={64} color="#CBD5E1" style={{
              marginBottom: 16,
              opacity: 0.6,
            }} />
            <Text style={{
              fontSize: 20,
              fontWeight: '600',
              color: theme.text,
              marginBottom: 8,
              textAlign: 'center',
            }}>
              No messages yet
            </Text>
            <Text style={{
              fontSize: 16,
              color: theme.textSecondary || '#64748B',
              textAlign: 'center',
              lineHeight: 24,
            }}>
              Start the conversation!
            </Text>
          </View>
        ) : (
          <>
            {console.log('📋 About to render', messages.length, 'messages')}
            {messages.map((msg, index) => renderMessage(msg, index))}
          </>
        )}
      </ScrollView>

      {/* Typing Indicators */}
      <TypingIndicator typingUsers={typingUsers} />
    </View>
  );
}