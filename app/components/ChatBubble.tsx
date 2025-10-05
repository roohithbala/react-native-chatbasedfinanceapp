import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { format } from 'date-fns';
import { useTheme } from '../context/ThemeContext';

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
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const isSystem = type === 'system' || type === 'command';

  const renderMessageText = () => {
    return (
      <Text style={[
        styles.messageText,
        isOwnMessage ? styles.ownMessageText : styles.otherMessageText,
        isSystem && styles.systemText
      ]}>
        {text}
      </Text>
    );
  };

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
        isOwnMessage ? styles.ownBubble : [styles.otherBubble, { backgroundColor: theme.surface }],
        isSystem && styles.systemBubble
      ]}>
        {renderMessageText()}
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

const getStyles = (theme: any) => StyleSheet.create({
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
    color: theme.textSecondary || '#6B7280',
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
    backgroundColor: theme.primary || '#EFF6FF',
    borderTopRightRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  otherBubble: {
    backgroundColor: theme.surface || 'white',
    borderTopLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  systemBubble: {
    backgroundColor: theme.surfaceSecondary || '#F8FAFC',
    borderWidth: 1,
    borderColor: theme.border || '#E2E8F0',
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
    color: theme.surface || '#FFFFFF',
  },
  otherMessageText: {
    color: theme.text || '#000000',
  },
  systemText: {
    color: theme.textSecondary || '#374151',
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
    color: theme.textSecondary || '#667781',
  },
  systemTimestamp: {
    color: theme.textSecondary || '#6B7280',
  },
  status: {
    fontSize: 11,
    color: theme.textSecondary || '#667781',
  },
  statusRead: {
    color: theme.primary || '#2563EB',
  },
});
