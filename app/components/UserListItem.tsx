import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface User {
  _id: string;
  name: string;
  username: string;
  email: string;
  avatar: string;
}

interface UserListItemProps {
  user: User;
  isSelected: boolean;
  onToggleSelection: (user: User) => void;
}

export default function UserListItem({
  user,
  isSelected,
  onToggleSelection,
}: UserListItemProps) {
  return (
    <TouchableOpacity
      style={[styles.userItem, isSelected && styles.selectedUserItem]}
      onPress={() => onToggleSelection(user)}
    >
      <View style={styles.userAvatar}>
        {user.avatar ? (
          <Text style={styles.avatarText}>{user.avatar}</Text>
        ) : (
          <Text style={styles.avatarText}>
            {user.name.charAt(0).toUpperCase()}
          </Text>
        )}
      </View>

      <View style={styles.userInfo}>
        <Text style={styles.userName}>{user.name}</Text>
        <Text style={styles.userDetail}>
          @{user.username} • {user.email}
        </Text>
      </View>

      <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
        {isSelected && (
          <Ionicons name="checkmark" size={16} color="white" />
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  selectedUserItem: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  userDetail: {
    fontSize: 14,
    color: '#64748B',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
});