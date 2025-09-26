import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { router } from 'expo-router';
import { useTheme } from '../context/ThemeContext';

interface User {
  _id: string;
  name: string;
  username: string;
  avatar: string;
  email: string;
}

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

interface Group {
  _id: string;
  name: string;
  description?: string;
  members?: any[];
}

interface ChatItemProps {
  item: User | ChatPreview | Group;
  type: 'user' | 'direct' | 'group';
  currentUser: any;
  mutedChats: Set<string>;
  blockedUsers: Set<string>;
  archivedChats: Set<string>;
  onPress: () => void;
  onLongPress?: (event: any) => void;
  onAddMembers?: (groupId: string, groupName: string) => void;
}

export const ChatItem: React.FC<ChatItemProps> = ({
  item,
  type,
  currentUser,
  mutedChats,
  blockedUsers,
  archivedChats,
  onPress,
  onLongPress,
  onAddMembers,
}) => {
  const { theme } = useTheme();
  const isMuted = mutedChats.has(item._id);
  const isBlocked = blockedUsers.has(item._id);
  const isArchived = archivedChats.has(item._id);

  if (type === 'user') {
    const user = item as User;
    return (
      <TouchableOpacity
        style={[styles.chatItem, { backgroundColor: theme.surface }]}
        onPress={onPress}
      >
        <View style={styles.avatarContainer}>
          {user.avatar && user.avatar.length > 0 ? (
            <Text style={styles.avatarText}>{user.avatar.charAt(0).toUpperCase()}</Text>
          ) : (
            <Text style={styles.avatarText}>
              {user.name.charAt(0).toUpperCase()}
            </Text>
          )}
        </View>
        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <Text style={styles.chatName}>{user.name}</Text>
            <Ionicons name="chevron-forward" size={16} color="#64748B" />
          </View>
          <Text style={styles.userUsername}>@{user.username}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  if (type === 'group') {
    const group = item as Group;
    const isAdmin = group.members?.some((member: any) =>
      (typeof member.userId === 'string' ? member.userId : member.userId._id) === currentUser?._id && member.role === 'admin'
    );

    return (
      <TouchableOpacity
        style={[styles.chatItem, { backgroundColor: theme.surface }]}
        onPress={onPress}
        onLongPress={onLongPress}
      >
        <View style={[styles.avatarContainer, styles.groupAvatar]}>
          <Ionicons name="people" size={24} color="#FFFFFF" />
        </View>
        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <Text style={styles.chatName}>{group.name}</Text>
            <View style={styles.chatActions}>
              {isMuted && <Ionicons name="volume-mute" size={16} color="#64748B" style={styles.statusIcon} />}
              {isArchived && <Ionicons name="archive" size={16} color="#64748B" style={styles.statusIcon} />}
              <TouchableOpacity
                style={styles.menuButton}
                onPress={(event) => {
                  event.stopPropagation();
                  onLongPress?.(event);
                }}
              >
                <Ionicons name="ellipsis-vertical" size={16} color="#64748B" />
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.groupDescription} numberOfLines={1}>
            {group.description || 'Group chat for shared expenses'}
          </Text>
          <View style={styles.chatMeta}>
            <Text style={styles.memberCount}>
              {group.members?.length || 0} members
            </Text>
            {isAdmin && onAddMembers && (
              <TouchableOpacity
                style={styles.addMemberButton}
                onPress={() => onAddMembers(group._id, group.name)}
              >
                <Ionicons name="person-add" size={16} color="#2563EB" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  if (type === 'direct') {
    const chat = item as ChatPreview;
    return (
      <TouchableOpacity
        style={[styles.chatItem, { backgroundColor: theme.surface }]}
        onPress={onPress}
        onLongPress={onLongPress}
      >
        <View style={styles.avatarContainer}>
          {chat.user.avatar && chat.user.avatar.length > 0 ? (
            <Text style={styles.avatarText}>{chat.user.avatar.charAt(0).toUpperCase()}</Text>
          ) : (
            <Text style={styles.avatarText}>
              {chat.user.name.charAt(0).toUpperCase()}
            </Text>
          )}
        </View>
        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <Text style={styles.chatName}>{chat.user.name}</Text>
            <View style={styles.chatActions}>
              {isMuted && <Ionicons name="volume-mute" size={16} color="#64748B" style={styles.statusIcon} />}
              {isBlocked && <Ionicons name="ban" size={16} color="#EF4444" style={styles.statusIcon} />}
              {isArchived && <Ionicons name="archive" size={16} color="#64748B" style={styles.statusIcon} />}
              <TouchableOpacity
                style={styles.menuButton}
                onPress={(event) => {
                  event.stopPropagation();
                  onLongPress?.(event);
                }}
              >
                <Ionicons name="ellipsis-vertical" size={16} color="#64748B" />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.chatPreview}>
            <Text style={styles.lastMessage} numberOfLines={1}>
              {chat.lastMessage}
            </Text>
            <View style={styles.chatMeta}>
              <Text style={styles.chatTime}>
                {format(new Date(chat.lastMessageAt), 'MMM d')}
              </Text>
              {chat.unreadCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadCount}>{chat.unreadCount}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 2,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  groupAvatar: {
    backgroundColor: '#2563EB',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
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
    flex: 1,
  },
  chatActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusIcon: {
    marginRight: 4,
  },
  menuButton: {
    padding: 4,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
  },
  chatMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  memberCount: {
    fontSize: 12,
    color: '#64748B',
    marginRight: 8,
  },
  groupActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addMemberButton: {
    marginLeft: 8,
    padding: 6,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
  },
  chatTime: {
    fontSize: 12,
    color: '#64748B',
  },
  groupDescription: {
    fontSize: 14,
    color: '#64748B',
  },
  userUsername: {
    fontSize: 14,
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
    backgroundColor: '#2563EB',
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

export default ChatItem;