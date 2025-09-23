import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

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
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Groups</Text>
      {(groups || []).map((group) => (
        <TouchableOpacity
          key={group._id}
          style={[
            styles.groupItem,
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
              <Ionicons name="checkmark-circle" size={20} color="#10B981" style={styles.checkIcon} />
            )}
            <TouchableOpacity
              style={styles.shareButton}
              onPress={() => onShareInvite(group._id)}
            >
              <Ionicons name="share-outline" size={16} color="#2563EB" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      ))}
      <TouchableOpacity
        style={styles.createGroupButton}
        onPress={() => router.push('/create-group')}
      >
        <Ionicons name="add" size={20} color="#2563EB" />
        <Text style={styles.createGroupText}>Create New Group</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
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
    borderColor: '#10B981',
  },
  groupIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
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
    color: '#1E293B',
    marginBottom: 4,
  },
  groupSubtitle: {
    fontSize: 14,
    color: '#64748B',
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
    backgroundColor: '#EFF6FF',
  },
  createGroupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#DBEAFE',
    borderStyle: 'dashed',
  },
  createGroupText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563EB',
    marginLeft: 8,
  },
});

export default GroupsSection;