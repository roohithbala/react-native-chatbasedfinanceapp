import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { format } from 'date-fns';

interface ChatMessageProps {
  text: string;
  createdAt: string;
  isOwnMessage: boolean;
  status: 'sent' | 'delivered' | 'read';
  senderName?: string;
}

export default function ChatMessage({ text, createdAt, isOwnMessage, status, senderName }: ChatMessageProps) {
  return (
    <View style={[styles.container, isOwnMessage ? styles.ownMessage : styles.otherMessage]}>
      {!isOwnMessage && senderName && (
        <Text style={styles.senderName}>{senderName}</Text>
      )}
      <View style={[
        styles.bubble, 
        isOwnMessage ? styles.ownBubble : styles.otherBubble
      ]}>
        <Text style={[
          styles.messageText,
          isOwnMessage ? styles.ownMessageText : styles.otherMessageText
        ]}>
          {text}
        </Text>
        <View style={styles.messageFooter}>
          <Text style={styles.timestamp}>
            {format(new Date(createdAt), 'HH:mm')}
          </Text>
          {isOwnMessage && status && (
            <Text style={[
              styles.status,
              status === 'read' && styles.statusRead
            ]}>
              {status === 'sent' ? '✓' : status === 'delivered' ? '✓✓' : '✓✓'}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 2,
    paddingHorizontal: 12,
  },
  ownMessage: {
    alignItems: 'flex-end',
  },
  otherMessage: {
    alignItems: 'flex-start',
  },
  senderName: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
    marginLeft: 12,
  },
  bubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  ownBubble: {
    backgroundColor: '#EFF6FF',
    borderTopRightRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  otherBubble: {
    backgroundColor: 'white',
    borderTopLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  ownMessageText: {
    color: '#000000',
  },
  otherMessageText: {
    color: '#000000',
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 2,
  },
  timestamp: {
    fontSize: 11,
    color: '#667781',
    marginRight: 4,
  },
  status: {
    fontSize: 11,
    color: '#667781',
  },
  statusRead: {
    color: '#2563EB',
  },
});
