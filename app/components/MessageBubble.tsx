import React from 'react';
import { View, StyleSheet } from 'react-native';

interface MessageBubbleProps {
  children: React.ReactNode;
  isOwnMessage: boolean;
  theme: any;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  children,
  isOwnMessage,
  theme,
}) => {
  const styles = getStyles(theme);

  return (
    <View style={[
      styles.bubble,
      isOwnMessage ? styles.ownBubble : [styles.otherBubble, { backgroundColor: theme.surface }]
    ]}>
      {children}
    </View>
  );
};

export default MessageBubble;

const getStyles = (theme: any) => StyleSheet.create({
  bubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
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
});