import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface ChatUser {
  _id: string;
  name: string;
  username: string;
}

interface MentionsListProps {
  showMentions: boolean;
  mentionResults: ChatUser[];
  onMentionPress: (user: ChatUser) => void;
}

export default function MentionsList({
  showMentions,
  mentionResults,
  onMentionPress,
}: MentionsListProps) {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  if (!showMentions || mentionResults.length === 0) {
    return null;
  }

  return (
    <View style={styles.mentionsContainer}>
      <ScrollView style={styles.mentionsList}>
        {mentionResults.map((user) => {
          if (!user || !user.name || !user.username) {
            console.warn('Invalid user object in mentions:', user);
            return null;
          }

          return (
            <TouchableOpacity
              key={user._id}
              style={styles.mentionItem}
              onPress={() => onMentionPress(user)}
            >
              <View style={styles.mentionAvatar}>
                <Text style={styles.mentionAvatarText}>
                  {user.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.mentionInfo}>
                <Text style={styles.mentionName}>{user.name}</Text>
                <Text style={styles.mentionUsername}>@{user.username}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  mentionsContainer: {
    backgroundColor: theme.surface,
    borderTopWidth: 1,
    borderTopColor: theme.border,
    maxHeight: 200,
  },
  mentionsList: {
    padding: 8,
  },
  mentionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
  mentionAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  mentionAvatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
  },
  mentionInfo: {
    flex: 1,
  },
  mentionName: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.text,
  },
  mentionUsername: {
    fontSize: 14,
    color: theme.textSecondary,
  },
});