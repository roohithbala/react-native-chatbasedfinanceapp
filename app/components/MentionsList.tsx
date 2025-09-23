import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

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

const styles = StyleSheet.create({
  mentionsContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
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
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  mentionAvatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B5563',
  },
  mentionInfo: {
    flex: 1,
  },
  mentionName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  mentionUsername: {
    fontSize: 14,
    color: '#6B7280',
  },
});