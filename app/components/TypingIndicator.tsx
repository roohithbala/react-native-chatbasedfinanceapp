import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface ChatUser {
  _id: string;
  name: string;
  username: string;
}

interface TypingIndicatorProps {
  typingUsers: ChatUser[];
}

export default function TypingIndicator({ typingUsers }: TypingIndicatorProps) {
  const { theme } = useTheme();
  const styles = getStyles(theme);
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

const getStyles = (theme: any) => StyleSheet.create({
  typingContainer: {
    backgroundColor: theme.surface,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  typingText: {
    fontSize: 14,
    color: theme.textSecondary,
    fontStyle: 'italic',
  },
});