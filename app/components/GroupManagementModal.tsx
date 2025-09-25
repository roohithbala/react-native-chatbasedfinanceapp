import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  ActivityIndicator,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFinanceStore } from '@/lib/store/financeStore';
import { groupsAPI } from '@/lib/services/api';
import GroupSettingsModal from './GroupSettingsModal';

interface GroupManagementModalProps {
  visible: boolean;
  onClose: () => void;
  groupId: string;
  groupName: string;
  onAddMember: () => void;
}

interface GroupMember {
  userId: {
    _id: string;
    name: string;
    username: string;
    email: string;
  };
  role: 'admin' | 'member';
  isActive: boolean;
  joinedAt: string;
}

export default function GroupManagementModal({
  visible,
  onClose,
  groupId,
  groupName,
  onAddMember
}: GroupManagementModalProps) {
  const [groupDetails, setGroupDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const { currentUser } = useFinanceStore();

  useEffect(() => {
    if (visible && groupId) {
      loadGroupDetails();
    }
  }, [visible, groupId]);

  const loadGroupDetails = async () => {
    if (!groupId) return;

    setIsLoading(true);
    try {
      const response = await groupsAPI.getGroup(groupId);
      setGroupDetails(response.group);
    } catch (error: any) {
      console.error('Error loading group details:', error);
      Alert.alert('Error', 'Failed to load group details');
    } finally {
      setIsLoading(false);
    }
  };

  const generateNewInviteCode = async () => {
    if (!groupId) return;

    setIsGeneratingCode(true);
    try {
      const response = await groupsAPI.generateInviteCode(groupId);
      setGroupDetails((prev: any) => ({
        ...prev,
        inviteCode: response.inviteCode
      }));
      Alert.alert('Success', 'New invite code generated successfully');
    } catch (error: any) {
      console.error('Error generating invite code:', error);
      Alert.alert('Error', error.message || 'Failed to generate invite code');
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const handleViewStats = async () => {
    if (!groupId) return;

    try {
      const stats = await groupsAPI.getGroupStats(groupId);
      Alert.alert(
        'Group Statistics',
        `Total Expenses: ₹${stats.overview?.totalAmount || 0}\n` +
        `Total Bills: ${stats.overview?.count || 0}\n` +
        `Settled: ${stats.overview?.settled || 0}\n` +
        `Pending: ${stats.overview?.pending || 0}`
      );
    } catch (error: any) {
      console.error('Error fetching group stats:', error);
      Alert.alert('Error', error.message || 'Failed to load group statistics');
    }
  };

  const handleGroupSettings = () => {
    setShowSettingsModal(true);
  };

  const handleNotifications = () => {
    setShowSettingsModal(true);
  };

  const handleLeaveGroup = async () => {
    if (!groupId) return;

    Alert.alert(
      'Leave Group',
      'Are you sure you want to leave this group? You will lose access to all group expenses and chats.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              await groupsAPI.leaveGroup(groupId);
              Alert.alert('Success', 'You have left the group successfully');
              onClose();
              // You might want to navigate back or refresh the group list here
            } catch (error: any) {
              console.error('Error leaving group:', error);
              Alert.alert('Error', error.message || 'Failed to leave group');
            }
          }
        }
      ]
    );
  };

  const handleMemberAction = (member: GroupMember) => {
    if (!isCurrentUserAdmin()) return;

    const actions = [];

    // Only show "Make Admin" for non-admin members
    if (member.role !== 'admin') {
      actions.push({
        text: 'Make Admin',
        onPress: () => handleMakeAdmin(member),
      });
    }

    // Show "Demote Admin" for admin members (but not for the current user if they're the only admin)
    if (member.role === 'admin') {
      const adminCount = groupDetails?.members?.filter((m: GroupMember) => m.role === 'admin' && m.isActive).length || 0;
      if (adminCount > 1) { // Only allow demotion if there are other admins
        actions.push({
          text: 'Demote Admin',
          style: 'default' as const,
          onPress: () => handleDemoteAdmin(member),
        });
      }
    }

    // Show "Remove from Group" for all members, but prevent removing the last admin
    const adminCount = groupDetails?.members?.filter((m: GroupMember) => m.role === 'admin' && m.isActive).length || 0;
    const isLastAdmin = member.role === 'admin' && adminCount === 1;

    if (!isLastAdmin) {
      actions.push({
        text: 'Remove from Group',
        style: 'destructive' as const,
        onPress: () => handleRemoveMember(member),
      });
    }

    // If no actions available (shouldn't happen), don't show the menu
    if (actions.length === 0) return;

    Alert.alert(
      `${member.userId.name}`,
      'Choose an action',
      [
        ...actions,
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const handleMakeAdmin = async (member: GroupMember) => {
    if (!groupId) return;

    try {
      await groupsAPI.makeMemberAdmin(groupId, member.userId._id);
      Alert.alert('Success', `${member.userId.name} is now an admin`);
      // Refresh group details to show updated roles
      loadGroupDetails();
    } catch (error: any) {
      console.error('Error making member admin:', error);
      Alert.alert('Error', error.message || 'Failed to make member admin');
    }
  };

  const handleDemoteAdmin = async (member: GroupMember) => {
    if (!groupId) return;

    Alert.alert(
      'Demote Admin',
      `Are you sure you want to demote ${member.userId.name} from admin to regular member?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Demote',
          style: 'default',
          onPress: async () => {
            try {
              await groupsAPI.demoteMember(groupId, member.userId._id);
              Alert.alert('Success', `${member.userId.name} has been demoted to regular member`);
              // Refresh group details to show updated roles
              loadGroupDetails();
            } catch (error: any) {
              console.error('Error demoting member:', error);
              Alert.alert('Error', error.message || 'Failed to demote member');
            }
          }
        }
      ]
    );
  };

  const handleRemoveMember = async (member: GroupMember) => {
    if (!groupId) return;

    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${member.userId.name} from the group?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await groupsAPI.removeMember(groupId, member.userId._id);
              Alert.alert('Success', `${member.userId.name} has been removed from the group`);
              // Refresh group details to show updated member list
              loadGroupDetails();
            } catch (error: any) {
              console.error('Error removing member:', error);
              Alert.alert('Error', error.message || 'Failed to remove member');
            }
          }
        }
      ]
    );
  };

  const handleGroupUpdated = () => {
    // Refresh group details after settings update
    loadGroupDetails();
  };

  const shareInviteCode = async () => {
    if (!groupDetails?.inviteCode) return;

    try {
      const message = `Join my group "${groupName}" on ChatBased Finance!\n\nInvite Code: ${groupDetails.inviteCode}\n\nDownload the app and use this code to join.`;
      await Share.share({
        message,
      });
    } catch (error: any) {
      console.error('Error sharing invite code:', error);
      Alert.alert('Error', 'Failed to share invite code');
    }
  };

  const isCurrentUserAdmin = () => {
    if (!currentUser || !groupDetails?.members) return false;
    const member = groupDetails.members.find((m: GroupMember) =>
      m.userId._id === currentUser._id
    );
    return member?.role === 'admin';
  };

  const renderMemberItem = (member: GroupMember) => {
    const isAdmin = member.role === 'admin';
    const isCurrentUser = member.userId._id === currentUser?._id;

    return (
      <View key={member.userId._id} style={styles.memberItem}>
        <View style={styles.memberAvatar}>
          <Text style={styles.memberAvatarText}>
            {member.userId.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.memberInfo}>
          <View style={styles.memberNameRow}>
            <Text style={styles.memberName}>{member.userId.name}</Text>
            {isAdmin && (
              <View style={styles.adminBadge}>
                <Text style={styles.adminBadgeText}>Admin</Text>
              </View>
            )}
            {isCurrentUser && (
              <View style={styles.youBadge}>
                <Text style={styles.youBadgeText}>You</Text>
              </View>
            )}
          </View>
          <Text style={styles.memberUsername}>@{member.userId.username}</Text>
        </View>
        {isCurrentUserAdmin() && !isCurrentUser && (member.role !== 'admin' || (member.role === 'admin' && (groupDetails?.members?.filter((m: GroupMember) => m.role === 'admin' && m.isActive).length || 0) > 1)) && (
          <TouchableOpacity style={styles.memberAction} onPress={() => handleMemberAction(member)}>
            <Ionicons name="ellipsis-vertical" size={20} color="#6B7280" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Group Management</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#6366F1" />
              <Text style={styles.loadingText}>Loading group details...</Text>
            </View>
          ) : (
            <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
              {/* Group Info Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Group Information</Text>
                <View style={styles.groupInfoCard}>
                  <Text style={styles.groupNameText}>{groupName}</Text>
                  <Text style={styles.groupDescription}>
                    {groupDetails?.description || 'No description'}
                  </Text>
                  <Text style={styles.groupMeta}>
                    {groupDetails?.members?.length || 0} members • Created {groupDetails?.createdAt ? new Date(groupDetails.createdAt).toLocaleDateString() : 'Unknown'}
                  </Text>
                </View>
              </View>

              {/* Invite Code Section */}
              {isCurrentUserAdmin() && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Invite Code</Text>
                  <View style={styles.inviteCodeCard}>
                    <View style={styles.inviteCodeRow}>
                      <Text style={styles.inviteCodeLabel}>Code:</Text>
                      <Text style={styles.inviteCode}>{groupDetails?.inviteCode || 'N/A'}</Text>
                    </View>
                    <View style={styles.inviteActions}>
                      <TouchableOpacity
                        style={[styles.inviteButton, styles.shareButton]}
                        onPress={shareInviteCode}
                      >
                        <Ionicons name="share-outline" size={16} color="#6366F1" />
                        <Text style={styles.shareButtonText}>Share</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.inviteButton, styles.regenerateButton, isGeneratingCode && styles.buttonDisabled]}
                        onPress={generateNewInviteCode}
                        disabled={isGeneratingCode}
                      >
                        {isGeneratingCode ? (
                          <ActivityIndicator size="small" color="#6366F1" />
                        ) : (
                          <>
                            <Ionicons name="refresh" size={16} color="#6366F1" />
                            <Text style={styles.regenerateButtonText}>Regenerate</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}

              {/* Members Section */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Members ({groupDetails?.members?.length || 0})</Text>
                  {isCurrentUserAdmin() && (
                    <TouchableOpacity style={styles.addMemberButton} onPress={onAddMember}>
                      <Ionicons name="person-add" size={16} color="#6366F1" />
                      <Text style={styles.addMemberText}>Add</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <View style={styles.membersList}>
                  {groupDetails?.members?.map(renderMemberItem)}
                </View>
              </View>

              {/* Quick Actions */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Quick Actions</Text>
                <View style={styles.actionsGrid}>
                  <TouchableOpacity style={styles.actionButton} onPress={handleViewStats}>
                    <Ionicons name="stats-chart" size={24} color="#6366F1" />
                    <Text style={styles.actionButtonText}>View Stats</Text>
                  </TouchableOpacity>
                  {isCurrentUserAdmin() && (
                    <TouchableOpacity style={styles.actionButton} onPress={handleGroupSettings}>
                      <Ionicons name="settings" size={24} color="#6366F1" />
                      <Text style={styles.actionButtonText}>Settings</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={styles.actionButton} onPress={handleNotifications}>
                    <Ionicons name="notifications" size={24} color="#6366F1" />
                    <Text style={styles.actionButtonText}>Notifications</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton} onPress={handleLeaveGroup}>
                    <Ionicons name="exit" size={24} color="#EF4444" />
                    <Text style={[styles.actionButtonText, styles.exitText]}>Leave Group</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          )}
        </View>
      </View>

      {/* Group Settings Modal */}
      <GroupSettingsModal
        visible={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        groupId={groupId}
        groupName={groupName}
        groupDetails={groupDetails}
        onGroupUpdated={handleGroupUpdated}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    minHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  closeButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  scrollContent: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  groupInfoCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  groupNameText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  groupDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  groupMeta: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  inviteCodeCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  inviteCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  inviteCodeLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginRight: 8,
  },
  inviteCode: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366F1',
    fontFamily: 'monospace',
  },
  inviteActions: {
    flexDirection: 'row',
    gap: 12,
  },
  inviteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  shareButton: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6366F1',
  },
  shareButtonText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
    color: '#6366F1',
  },
  regenerateButton: {
    backgroundColor: '#FFFFFF',
  },
  regenerateButtonText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
    color: '#6366F1',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  addMemberButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  addMemberText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '500',
    color: '#6366F1',
  },
  membersList: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberAvatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  memberInfo: {
    flex: 1,
    marginLeft: 12,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginRight: 8,
  },
  adminBadge: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 10,
  },
  adminBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#D97706',
    textTransform: 'uppercase',
  },
  youBadge: {
    backgroundColor: '#DBEAFE',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 10,
  },
  youBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#2563EB',
    textTransform: 'uppercase',
  },
  memberUsername: {
    fontSize: 14,
    color: '#6B7280',
  },
  memberAction: {
    padding: 4,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  actionButtonText: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center',
  },
  exitText: {
    color: '#EF4444',
  },
});