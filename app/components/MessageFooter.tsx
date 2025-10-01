import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { format } from 'date-fns';

interface MessageFooterProps {
  createdAt: string;
  status?: 'sent' | 'delivered' | 'read';
  isOwnMessage: boolean;
  theme: any;
}

export const MessageFooter: React.FC<MessageFooterProps> = ({
  createdAt,
  status,
  isOwnMessage,
  theme,
}) => {
  const styles = getStyles(theme);

  return (
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
  );
};

export default MessageFooter;

const getStyles = (theme: any) => StyleSheet.create({
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 2,
  },
  timestamp: {
    fontSize: 11,
    color: theme.textSecondary || '#667781',
    marginRight: 4,
  },
  status: {
    fontSize: 11,
    color: theme.textSecondary || '#667781',
  },
  statusRead: {
    color: theme.primary || '#2563EB',
  },
});