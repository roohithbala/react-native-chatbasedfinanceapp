import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import ChatBubble from './ChatBubble';
import { useTheme } from '../context/ThemeContext';

interface Message {
  _id: string;
  text: string;
  createdAt: string;
  user: {
    _id: string;
    name: string;
    username: string;
    avatar?: string;
  };
  type: 'text' | 'image' | 'file' | 'system' | 'command';
  status: 'sent' | 'delivered' | 'read' | 'error';
  isTemp?: boolean;
  readBy: {
    userId: string;
    readAt: string;
  }[];
}

interface MessagesListProps {
  messages: Message[];
  isLoading: boolean;
  currentUserId: string;
  scrollViewRef: React.RefObject<ScrollView>;
}

export default function MessagesList({
  messages,
  isLoading,
  currentUserId,
  scrollViewRef,
}: MessagesListProps) {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const renderMessage = (msg: Message) => {
    if (!msg || !msg.user) {
      console.warn('Invalid message object:', msg);
      return null;
    }

    const isOwnMessage = msg.user._id === currentUserId;
    console.log('Rendering message:', msg._id, 'isOwn:', isOwnMessage, 'text:', msg.text.substring(0, 50));

    return (
      <ChatBubble
        key={msg._id}
        text={msg.text}
        createdAt={msg.createdAt}
        isOwnMessage={isOwnMessage}
        status={msg.status === 'error' ? 'sent' : msg.status}
        type={msg.type}
        senderName={!isOwnMessage ? msg.user.name : undefined}
      />
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading messages...</Text>
      </View>
    );
  }

  return (
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
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messagesContent: {
    paddingVertical: 16,
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
    color: theme.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: 'center',
  },
});