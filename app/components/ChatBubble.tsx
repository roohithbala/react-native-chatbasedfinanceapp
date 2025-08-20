import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { format } from 'date-fns';

interface ChatBubbleProps {
  text: string;
  createdAt: string;
  isOwnMessage: boolean;
  status: 'sent' | 'delivered' | 'read';
  type?: 'text' | 'image' | 'file' | 'system' | 'command';
  senderName?: string;
}

export default function ChatBubble({ 
  text, 
  createdAt, 
  isOwnMessage, 
  status, 
  type = 'text',
  senderName 
}: ChatBubbleProps) {
  const isSystem = type === 'system' || type === 'command';

  return (
    <View style={[
      styles.container,
      isOwnMessage ? styles.ownMessage : styles.otherMessage
    ]}>
      {!isOwnMessage && !isSystem && senderName && (
        <Text style={styles.senderName}>{senderName}</Text>
      )}
      <View style={[
        styles.bubble,
        isOwnMessage ? styles.ownBubble : styles.otherBubble,
        isSystem && styles.systemBubble
      ]}>
        <Text style={[
          styles.messageText,
          isOwnMessage ? styles.ownMessageText : styles.otherMessageText,
          isSystem && styles.systemText
        ]}>
          {text}
        </Text>
        <View style={styles.footer}>
          <Text style={[
            styles.timestamp,
            isSystem && styles.systemTimestamp
          ]}>
            {format(new Date(createdAt), 'HH:mm')}
          </Text>
          {isOwnMessage && (
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
    minWidth: 80,
  },
  ownBubble: {
    backgroundColor: '#DCF8C6', // WhatsApp green
    borderTopRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  systemBubble: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
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
  systemText: {
    color: '#374151',
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 2,
    gap: 4,
  },
  timestamp: {
    fontSize: 11,
    color: '#667781',
  },
  systemTimestamp: {
    color: '#6B7280',
  },
  status: {
    fontSize: 11,
    color: '#667781',
  },
  statusRead: {
    color: '#53bdeb', // WhatsApp blue ticks
  },
});
