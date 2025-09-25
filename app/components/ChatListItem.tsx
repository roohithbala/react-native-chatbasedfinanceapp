import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { format } from 'date-fns';

interface ChatPreview {
  _id: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  user: {
    name: string;
    username: string;
    avatar: string;
  };
}

interface ChatListItemProps {
  chat: ChatPreview;
  onPress: () => void;
}

export default function ChatListItem({ chat, onPress }: ChatListItemProps) {
  return (
    <TouchableOpacity style={styles.chatItem} onPress={onPress}>
      <View style={styles.avatarContainer}>
        <Text style={styles.avatarText}>{chat.user.avatar}</Text>
      </View>
      <View style={styles.chatInfo}>
        <View style={styles.chatHeader}>
          <Text style={styles.chatName}>{chat.user.name}</Text>
          <Text style={styles.chatTime}>
            {format(new Date(chat.lastMessageAt), 'MMM d')}
          </Text>
        </View>
        <View style={styles.chatPreview}>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {chat.lastMessage}
          </Text>
          {chat.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadCount}>{chat.unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
  },
  chatInfo: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  chatTime: {
    fontSize: 12,
    color: '#64748B',
  },
  chatPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    flex: 1,
    fontSize: 14,
    color: '#64748B',
    marginRight: 8,
  },
  unreadBadge: {
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  unreadCount: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});