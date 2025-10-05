import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  FlatList,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFinanceStore } from '@/lib/store/financeStore';
import { useTheme } from './context/ThemeContext';
import { groupsAPI } from '@/lib/services/api';
import ExpenseScreenHeader from '@/app/components/ExpenseScreenHeader';

export default function GroupSettingsScreen() {
  const { groupId, mode } = useLocalSearchParams();
  const [groupName, setGroupName] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [group, setGroup] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const {
    currentUser,
    updateGroup,
    removeMemberFromGroup,
    deleteGroup,
  } = useFinanceStore();

  const { theme } = useTheme();
  const styles = getStyles(theme);

  useEffect(() => {
    const fetchGroupDetails = async () => {
      try {
        setIsLoading(true);
        const groupData = await groupsAPI.getGroup(groupId as string);
        setGroup(groupData);
        setGroupName(groupData.name);
        setMembers(groupData.members || []);
      } catch (error) {
        console.error('Error fetching group details:', error);
        Alert.alert('Error', 'Failed to load group details');
        router.back();
      } finally {
        setIsLoading(false);
      }
    };

    if (groupId) {
      fetchGroupDetails();
    }
  }, [groupId]);

  const handleSaveGroupName = async () => {
    if (!groupName.trim()) {
      Alert.alert('Error', 'Group name cannot be empty');
      return;
    }

    try {
      await updateGroup(groupId as string, { name: groupName.trim() });
      setIsEditing(false);
      Alert.alert('Success', 'Group name updated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update group name');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    Alert.alert(
      'Remove Member',
      'Are you sure you want to remove this member from the group?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeMemberFromGroup(groupId as string, memberId);
              // Refresh group data after removal
              const updatedGroup = await groupsAPI.getGroup(groupId as string);
              setGroup(updatedGroup);
              setMembers(updatedGroup.members || []);
              Alert.alert('Success', 'Member removed successfully!');
            } catch (error) {
              Alert.alert('Error', 'Failed to remove member');
            }
          },
        },
      ]
    );
  };

  const handleDeleteGroup = () => {
    Alert.alert(
      'Delete Group',
      'Are you sure you want to delete this group? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteGroup(groupId as string);
              router.back();
              Alert.alert('Success', 'Group deleted successfully!');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete group');
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.centerContent}>
          <Text style={[styles.errorText, { color: theme.text }]}>Loading group details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!group) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.centerContent}>
          <Text style={[styles.errorText, { color: theme.error }]}>Group not found</Text>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: theme.primary }]}
            onPress={() => router.back()}
          >
            <Text style={[styles.backButtonText, { color: theme.background }]}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isOwner = group.members?.some((member: any) =>
    member.userId._id === currentUser?._id && member.role === 'admin'
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ExpenseScreenHeader title="Group Settings" />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {mode === 'edit' && (
          <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Edit Group Name</Text>
            <View style={styles.groupNameContainer}>
              {isEditing ? (
                <View style={styles.editContainer}>
                  <TextInput
                    style={[styles.textInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                    value={groupName}
                    onChangeText={setGroupName}
                    placeholder="Enter group name"
                    placeholderTextColor={theme.textSecondary}
                  />
                  <View style={styles.editButtons}>
                    <TouchableOpacity
                      style={[styles.saveButton, { backgroundColor: theme.primary }]}
                      onPress={handleSaveGroupName}
                    >
                      <Ionicons name="checkmark" size={16} color={theme.background} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.cancelButton, { backgroundColor: theme.error }]}
                      onPress={() => {
                        setGroupName(group.name);
                        setIsEditing(false);
                      }}
                    >
                      <Ionicons name="close" size={16} color={theme.background} />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.nameDisplay}>
                  <Text style={[styles.groupName, { color: theme.text }]}>{groupName}</Text>
                  {isOwner && (
                    <TouchableOpacity
                      style={[styles.editButton, { backgroundColor: theme.primary }]}
                      onPress={() => setIsEditing(true)}
                    >
                      <Ionicons name="pencil" size={16} color={theme.background} />
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          </View>
        )}

        {mode === 'members' && (
          <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Group Members</Text>
            <View style={styles.membersList}>
              {members.map((item) => {
                // Handle both populated and non-populated member data
                const memberName = item.userId?.name || item.userId?.username || 'Unknown User';
                const memberEmail = item.userId?.email || '';
                const memberId = item.userId?._id || item.userId;

                return (
                  <View key={memberId} style={[styles.memberItem, { backgroundColor: theme.background, borderColor: theme.border }]}>
                    <View style={styles.memberInfo}>
                      <Text style={[styles.memberName, { color: theme.text }]}>{memberName}</Text>
                      {memberEmail ? (
                        <Text style={[styles.memberEmail, { color: theme.textSecondary }]}>{memberEmail}</Text>
                      ) : null}
                      <Text style={[styles.memberRole, { color: item.role === 'admin' ? theme.primary : theme.textSecondary }]}>
                        {item.role === 'admin' ? 'Admin' : 'Member'}
                      </Text>
                    </View>
                    {isOwner && memberId !== currentUser?._id && (
                      <TouchableOpacity
                        style={[styles.removeButton, { backgroundColor: theme.error }]}
                        onPress={() => handleRemoveMember(memberId)}
                      >
                        <Ionicons name="remove" size={16} color={theme.background} />
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {mode === 'settings' && isOwner && (
          <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Group Settings</Text>

            <TouchableOpacity
              style={[styles.settingItem, { borderBottomColor: theme.border }]}
              onPress={() => router.push(`/group-settings?groupId=${groupId}&mode=edit`)}
            >
              <View style={styles.settingContent}>
                <Ionicons name="pencil" size={20} color={theme.primary} />
                <Text style={[styles.settingText, { color: theme.text }]}>Edit Group Name</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.settingItem, { borderBottomColor: theme.border }]}
              onPress={() => router.push(`/group-settings?groupId=${groupId}&mode=members`)}
            >
              <View style={styles.settingContent}>
                <Ionicons name="people" size={20} color={theme.primary} />
                <Text style={[styles.settingText, { color: theme.text }]}>Manage Members</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.dangerItem, { borderBottomColor: theme.border }]}
              onPress={handleDeleteGroup}
            >
              <View style={styles.settingContent}>
                <Ionicons name="trash" size={20} color={theme.error} />
                <Text style={[styles.dangerText, { color: theme.error }]}>Delete Group</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.error} />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  groupNameContainer: {
    marginTop: 8,
  },
  editContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  editButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  saveButton: {
    padding: 8,
    borderRadius: 6,
  },
  cancelButton: {
    padding: 8,
    borderRadius: 6,
  },
  nameDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  groupName: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  editButton: {
    padding: 8,
    borderRadius: 6,
  },
  membersList: {
    maxHeight: 400,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
  },
  memberEmail: {
    fontSize: 14,
  },
  memberRole: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  removeButton: {
    padding: 6,
    borderRadius: 4,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  settingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  dangerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  dangerText: {
    fontSize: 16,
    fontWeight: '500',
  },
});