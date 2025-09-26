import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../context/ThemeContext';

interface GroupsSectionProps {
  groups: any[];
  selectedGroup: any;
  onSelectGroup: (group: any) => void;
  onShareInvite: (groupId: string) => void;
}

export const GroupsSection: React.FC<GroupsSectionProps> = ({
  groups,
  selectedGroup,
  onSelectGroup,
  onShareInvite,
}) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Groups</Text>
      {(groups || []).map((group) => (
        <TouchableOpacity
          key={group._id}
          style={[
            styles.groupItem,
            { backgroundColor: theme.surface },
            selectedGroup?._id === group._id && styles.selectedGroupItem
          ]}
          onPress={() => onSelectGroup(group)}
        >
          <View style={styles.groupIcon}>
            <Text style={styles.groupEmoji}>{group.avatar}</Text>
          </View>
          <View style={styles.groupContent}>
            <Text style={styles.groupTitle}>{group.name}</Text>
            <Text style={styles.groupSubtitle}>
              {group.members.length} members • Code: {group.inviteCode}
            </Text>
          </View>
          <View style={styles.groupActions}>
            {selectedGroup?._id === group._id && (
              <Ionicons name="checkmark-circle" size={20} color={theme.success} style={styles.checkIcon} />
            )}
            <TouchableOpacity
              style={styles.shareButton}
              onPress={() => onShareInvite(group._id)}
            >
              <Ionicons name="share-outline" size={16} color={theme.primary} />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      ))}
      <TouchableOpacity
        style={styles.createGroupButton}
        onPress={() => router.push('/create-group')}
      >
        <Ionicons name="add" size={20} color={theme.primary} />
        <Text style={styles.createGroupText}>Create New Group</Text>
      </TouchableOpacity>
    </View>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 16,
  },
  groupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedGroupItem: {
    borderWidth: 2,
    borderColor: theme.success,
  },
  groupIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  groupEmoji: {
    fontSize: 20,
  },
  groupContent: {
    flex: 1,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 4,
  },
  groupSubtitle: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  groupActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkIcon: {
    marginRight: 8,
  },
  shareButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: theme.surfaceSecondary,
  },
  createGroupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.surfaceSecondary,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: theme.border,
    borderStyle: 'dashed',
  },
  createGroupText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.primary,
    marginLeft: 8,
  },
});

export default GroupsSection;