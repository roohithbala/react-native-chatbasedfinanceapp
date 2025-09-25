import React from 'react';
import { FlatList, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface User {
  _id: string;
  name: string;
  username: string;
  avatar: string;
}

interface UserSearchResultsProps {
  users: User[];
  onUserSelect: (userId: string) => void;
  emptyText?: string;
}

export default function UserSearchResults({
  users,
  onUserSelect,
  emptyText = "No users found",
}: UserSearchResultsProps) {
  const renderUserItem = ({ item }: { item: User }) => (
    <View style={styles.userItem}>
      <View style={styles.avatarContainer}>
        <Text style={styles.avatarText}>{item.avatar}</Text>
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name}</Text>
        <Text style={styles.userUsername}>@{item.username}</Text>
      </View>
    </View>
  );

  return (
    <FlatList
      data={users}
      renderItem={({ item }) => (
        <View style={styles.userItem}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{item.avatar}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{item.name}</Text>
            <Text style={styles.userUsername}>@{item.username}</Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={20}
            color="#CBD5E1"
            style={styles.chevron}
          />
        </View>
      )}
      keyExtractor={(item) => item._id}
      contentContainerStyle={styles.listContainer}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{emptyText}</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  listContainer: {
    flexGrow: 1,
  },
  userItem: {
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
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  userUsername: {
    fontSize: 14,
    color: '#64748B',
  },
  chevron: {
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
});