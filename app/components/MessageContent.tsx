import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { format } from 'date-fns';

interface MessageContentProps {
  text: string;
  isOwnMessage: boolean;
  theme: any;
}

export const MessageContent: React.FC<MessageContentProps> = ({
  text,
  isOwnMessage,
  theme,
}) => {
  const styles = getStyles(theme);

  return (
    <Text style={[
      styles.messageText,
      isOwnMessage ? styles.ownMessageText : styles.otherMessageText
    ]}>
      {text}
    </Text>
  );
};

export default MessageContent;

const getStyles = (theme: any) => StyleSheet.create({
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
});