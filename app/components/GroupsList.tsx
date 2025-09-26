import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../context/ThemeContext';

interface Group {
  _id: string;
  name: string;
  members: any[];
}

interface GroupsListProps {
  groups: Group[];
}

export default function GroupsList({ groups }: GroupsListProps) {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Your Groups</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/chats')}>
          <Text style={styles.seeAllButton}>View All</Text>
        </TouchableOpacity>
      </View>
      {(groups || []).length > 0 ? (
        (groups || []).slice(0, 3).map((group, index) => (
          <TouchableOpacity
            key={group._id || index}
            style={styles.groupItem}
            onPress={() => router.push('/(tabs)/chats')}
          >
            <View style={styles.groupIcon}>
              <Ionicons name="people" size={20} color={theme.primary} />
            </View>
            <View style={styles.groupDetails}>
              <Text style={styles.groupName}>{group.name}</Text>
              <Text style={styles.groupMembers}>
                {group.members.length} members
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
          </TouchableOpacity>
        ))
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="people-outline" size={32} color={theme.textTertiary} />
          <Text style={styles.emptyStateText}>No groups yet</Text>
        </View>
      )}
    </View>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.text,
  },
  seeAllButton: {
    fontSize: 14,
    color: theme.primary,
    fontWeight: '600',
  },
  groupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  groupIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.primary + '20', // 20% opacity
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  groupDetails: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.text,
    marginBottom: 2,
  },
  groupMembers: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyStateText: {
    fontSize: 14,
    color: theme.textSecondary,
    marginTop: 8,
  },
});

export { GroupsList };