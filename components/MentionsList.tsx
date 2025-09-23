import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { ChatUser } from '@/app/types/chat';

interface MentionsListProps {
  mentionResults: ChatUser[];
  onSelectMention: (user: ChatUser) => void;
}

export const MentionsList: React.FC<MentionsListProps> = ({
  mentionResults,
  onSelectMention
}) => {
  if (mentionResults.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
        {mentionResults.map((user) => (
          <TouchableOpacity
            key={user._id}
            style={styles.mentionItem}
            onPress={() => onSelectMention(user)}
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
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    maxHeight: 200,
  },
  list: {
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