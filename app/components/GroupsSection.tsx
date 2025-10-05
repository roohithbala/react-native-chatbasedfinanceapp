import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../context/ThemeContext';

interface GroupsSectionProps {
  groups: any[];
  selectedGroup: any;
  onSelectGroup: (group: any) => void;
  onShareInvite: (groupId: string) => void;
  onJoinGroup?: () => void;
  onEditGroup?: (group: any) => void;
  onDeleteGroup?: (groupId: string) => void;
  onManageMembers?: (group: any) => void;
  onGroupSettings?: (group: any) => void;
}

export const GroupsSection: React.FC<GroupsSectionProps> = ({
  groups,
  selectedGroup,
  onSelectGroup,
  onShareInvite,
  onJoinGroup,
  onEditGroup,
  onDeleteGroup,
  onManageMembers,
  onGroupSettings,
}) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const [showGroupMenu, setShowGroupMenu] = useState<string | null>(null);

  const handleGroupMenuPress = (groupId: string) => {
    setShowGroupMenu(showGroupMenu === groupId ? null : groupId);
  };

  const handleDeleteGroup = (group: any) => {
    Alert.alert(
      'Delete Group',
      `Are you sure you want to delete "${group.name}"? This action cannot be undone and will remove all group data.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            onDeleteGroup?.(group._id);
            setShowGroupMenu(null);
          }
        },
      ]
    );
  };

  const handleEditGroup = (group: any) => {
    onEditGroup?.(group);
    setShowGroupMenu(null);
  };

  const handleManageMembers = (group: any) => {
    onManageMembers?.(group);
    setShowGroupMenu(null);
  };

  const handleGroupSettings = (group: any) => {
    onGroupSettings?.(group);
    setShowGroupMenu(null);
  };

  const handleViewGroupStats = (group: any) => {
    router.push(`/group-stats?groupId=${group._id}&groupName=${encodeURIComponent(group.name)}`);
    setShowGroupMenu(null);
  };
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Groups</Text>
        <TouchableOpacity
          style={styles.createGroupButton}
          onPress={() => router.push('/create-group')}
        >
          <Ionicons name="add" size={20} color={theme.primary} />
          <Text style={styles.createGroupText}>Create</Text>
        </TouchableOpacity>
      </View>

      {(groups || []).map((group) => (
        <View key={group._id}>
          <TouchableOpacity
            style={[
              styles.groupItem,
              { backgroundColor: theme.surface },
              selectedGroup?._id === group._id && styles.selectedGroupItem
            ]}
            onPress={() => onSelectGroup(group)}
            onLongPress={() => handleGroupMenuPress(group._id)}
          >
            <View style={styles.groupIcon}>
              <Text style={styles.groupEmoji}>{group.avatar || '👥'}</Text>
            </View>
            <View style={styles.groupContent}>
              <Text style={styles.groupTitle}>{group.name}</Text>
              <Text style={styles.groupSubtitle}>
                {group.members?.length || 0} members • {group.inviteCode}
              </Text>
              {group.description && (
                <Text style={styles.groupDescription} numberOfLines={1}>
                  {group.description}
                </Text>
              )}
            </View>
            <View style={styles.groupActions}>
              {selectedGroup?._id === group._id && (
                <View style={[styles.selectedIndicator, { backgroundColor: theme.success }]}>
                  <Ionicons name="checkmark" size={12} color="white" />
                </View>
              )}
              <TouchableOpacity
                style={styles.shareButton}
                onPress={() => onShareInvite(group._id)}
              >
                <Ionicons name="share-outline" size={16} color={theme.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.menuButton}
                onPress={() => handleGroupMenuPress(group._id)}
              >
                <Ionicons name="ellipsis-vertical" size={16} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>

          {/* Group Menu */}
          {showGroupMenu === group._id && (
            <View style={[styles.groupMenu, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleViewGroupStats(group)}
              >
                <Ionicons name="stats-chart" size={18} color={theme.text} />
                <Text style={[styles.menuItemText, { color: theme.text }]}>View Statistics</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleManageMembers(group)}
              >
                <Ionicons name="people" size={18} color={theme.text} />
                <Text style={[styles.menuItemText, { color: theme.text }]}>Manage Members</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleEditGroup(group)}
              >
                <Ionicons name="pencil" size={18} color={theme.text} />
                <Text style={[styles.menuItemText, { color: theme.text }]}>Edit Group</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleGroupSettings(group)}
              >
                <Ionicons name="settings" size={18} color={theme.text} />
                <Text style={[styles.menuItemText, { color: theme.text }]}>Group Settings</Text>
              </TouchableOpacity>

              <View style={[styles.menuDivider, { backgroundColor: theme.border }]} />

              <TouchableOpacity
                style={[styles.menuItem, styles.deleteMenuItem]}
                onPress={() => handleDeleteGroup(group)}
              >
                <Ionicons name="trash" size={18} color={theme.error} />
                <Text style={[styles.menuItemText, { color: theme.error }]}>Delete Group</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ))}

      {(groups || []).length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="people-outline" size={48} color={theme.textSecondary} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>No Groups Yet</Text>
          <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
            Create your first group to start splitting bills with friends
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.joinGroupButton}
        onPress={onJoinGroup}
      >
        <Ionicons name="enter" size={20} color={theme.primary} />
        <Text style={styles.joinGroupText}>Join Group</Text>
      </TouchableOpacity>
    </View>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  section: {
    marginBottom: 32,
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
  groupDescription: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 2,
  },
  groupActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  shareButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: theme.surfaceSecondary,
    marginRight: 4,
  },
  menuButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: theme.surfaceSecondary,
  },
  groupMenu: {
    marginTop: -8,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  menuItemText: {
    fontSize: 16,
    marginLeft: 12,
  },
  menuDivider: {
    height: 1,
    marginHorizontal: 12,
  },
  deleteMenuItem: {
    // Additional styling for delete item if needed
  },
  createGroupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surfaceSecondary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  createGroupText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.primary,
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  joinGroupButton: {
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
  joinGroupText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.primary,
    marginLeft: 8,
  },
});

export default GroupsSection;