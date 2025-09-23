import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ChatUser {
  _id: string;
  name: string;
  username: string;
}

interface TypingIndicatorProps {
  typingUsers: ChatUser[];
}

export default function TypingIndicator({ typingUsers }: TypingIndicatorProps) {
  if (typingUsers.length === 0) {
    return null;
  }

  return (
    <View style={styles.typingContainer}>
      <Text style={styles.typingText}>
        {typingUsers.length === 1
          ? `${typingUsers[0]?.name || 'Someone'} is typing...`
          : `${typingUsers.length} people are typing...`
        }
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
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