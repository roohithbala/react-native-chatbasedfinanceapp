import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ChatUser } from '@/app/types/chat';
import { useTheme } from '../app/context/ThemeContext';

interface TypingIndicatorProps {
  typingUsers: ChatUser[];
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ typingUsers }) => {
  const { theme } = useTheme();
  if (typingUsers.length === 0) {
    return null;
  }

  const getTypingText = () => {
    if (typingUsers.length === 1) {
      return `${typingUsers[0].name} is typing...`;
    } else if (typingUsers.length === 2) {
      return `${typingUsers[0].name} and ${typingUsers[1].name} are typing...`;
    } else {
      return `${typingUsers[0].name} and ${typingUsers.length - 1} others are typing...`;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
      <Text style={[styles.typingText, { color: theme.textSecondary }]}>{getTypingText()}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
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