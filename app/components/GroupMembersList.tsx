import React from 'react';
import { View, Text, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

interface GroupMembersListProps {
  members: any[];
  currentUser: any;
  isOwner: boolean;
  onRemoveMember: (memberId: string) => void;
}

export default function GroupMembersList({
  members,
  currentUser,
  isOwner,
  onRemoveMember,
}: GroupMembersListProps) {
  const { theme } = useTheme();

  const renderMember = ({ item }: { item: any }) => {
    // Handle both populated and non-populated member data
    const memberName = item.userId?.name || item.userId?.username || 'Unknown User';
    const memberEmail = item.userId?.email || '';
    const memberId = item.userId?._id || item.userId;

    return (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: 12,
          marginBottom: 8,
          borderRadius: 8,
          borderWidth: 1,
          backgroundColor: theme.background,
          borderColor: theme.border,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: '500', color: theme.text }}>
            {memberName}
          </Text>
          {memberEmail ? (
            <Text style={{ fontSize: 14, color: theme.textSecondary }}>
              {memberEmail}
            </Text>
          ) : null}
          <Text
            style={{
              fontSize: 12,
              fontWeight: '500',
              marginTop: 2,
              color: item.role === 'admin' ? theme.primary : theme.textSecondary,
            }}
          >
            {item.role === 'admin' ? 'Admin' : 'Member'}
          </Text>
        </View>
        {isOwner && memberId !== currentUser?._id && (
          <TouchableOpacity
            style={{ padding: 6, borderRadius: 4, backgroundColor: theme.error }}
            onPress={() => onRemoveMember(memberId)}
          >
            <Ionicons name="remove" size={16} color={theme.background} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={{ maxHeight: 400 }}>
      <FlatList
        data={members}
        keyExtractor={(item) => item.userId?._id || item.userId}
        renderItem={renderMember}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}