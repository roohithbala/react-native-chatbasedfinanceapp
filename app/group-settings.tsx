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
import GroupNameEditor from './components/GroupNameEditor';
import GroupMembersList from './components/GroupMembersList';
import GroupSettingsActions from './components/GroupSettingsActions';
import { getStyles } from '@/lib/styles/groupSettingsStyles';

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
            <GroupNameEditor
              group={group}
              groupName={groupName}
              isEditing={isEditing}
              isOwner={isOwner}
              onGroupNameChange={setGroupName}
              onSave={handleSaveGroupName}
              onCancel={() => {
                setGroupName(group.name);
                setIsEditing(false);
              }}
              onStartEdit={() => setIsEditing(true)}
            />
          </View>
        )}

        {mode === 'members' && (
          <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Group Members</Text>
            <GroupMembersList
              members={members}
              currentUser={currentUser}
              isOwner={isOwner}
              onRemoveMember={handleRemoveMember}
            />
          </View>
        )}

        {mode === 'settings' && isOwner && (
          <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Group Settings</Text>
            <GroupSettingsActions
              groupId={groupId as string}
              onDeleteGroup={handleDeleteGroup}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}