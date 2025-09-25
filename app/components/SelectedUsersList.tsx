import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface User {
  _id: string;
  name: string;
  username: string;
  email: string;
  avatar: string;
}

interface SelectedUsersListProps {
  selectedUsers: User[];
  onRemoveUser: (user: User) => void;
}

export default function SelectedUsersList({
  selectedUsers,
  onRemoveUser,
}: SelectedUsersListProps) {
  if (selectedUsers.length === 0) {
    return null;
  }

  return (
    <View style={styles.selectedContainer}>
      <Text style={styles.selectedTitle}>
        Selected ({selectedUsers.length})
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectedUsers}>
        {selectedUsers.map(user => (
          <View key={user._id} style={styles.selectedUserChip}>
            <Text style={styles.selectedUserText}>{user.name}</Text>
            <TouchableOpacity
              onPress={() => onRemoveUser(user)}
              style={styles.removeUserButton}
            >
              <Ionicons name="close" size={16} color="#64748B" />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  selectedContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  selectedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  selectedUsers: {
    flexDirection: 'row',
  },
  selectedUserChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  selectedUserText: {
    fontSize: 14,
    color: '#2563EB',
    marginRight: 8,
  },
  removeUserButton: {
    padding: 2,
  },
});