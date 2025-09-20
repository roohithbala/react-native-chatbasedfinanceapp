import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
  TextInput,
  Share,
  Platform,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import EditProfileModal from '@/app/components/EditProfileModal';
import GroupJoinScreen from '@/app/components/GroupJoinScreen';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFinanceStore } from '@/lib/store/financeStore';

export default function ProfileScreen() {
  const [notifications, setNotifications] = useState(true);
  const [biometric, setBiometric] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [autoSync, setAutoSync] = useState(true);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const { 
    currentUser, 
    expenses, 
    splitBills, 
    groups, 
    selectedGroup, 
    selectGroup, 
    createGroup, 
    generateInviteLink,
    logout,
    isLoading 
  } = useFinanceStore();

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const totalSplitBills = splitBills.length;

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }

    try {
      await createGroup({ name: groupName.trim() });
      setGroupName('');
      setShowGroupModal(false);
      Alert.alert('Success', 'Group created successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to create group');
    }
  };


  const handleShareInvite = async (groupId: string) => {
    const group = groups.find(g => g._id === groupId);
    if (!group) return;

    const inviteLink = generateInviteLink(groupId);
    const message = `Join my SecureFinance group "${group.name}"!\n\nInvite Code: ${group.inviteCode}\nLink: ${inviteLink}`;

    try {
      if (Platform.OS === 'web') {
        await Clipboard.setStringAsync(message);
        Alert.alert('Copied!', 'Invite link copied to clipboard');
      } else {
        await Share.share({
          message: message,
          title: `Join ${group.name} on SecureFinance`,
        });
      }
    } catch (error) {
      console.error('Share error:', error);
      Alert.alert('Error', 'Failed to share invite');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out', 
      'Are you sure you want to sign out?', 
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out');
            }
          }
        },
      ]
    );
  };

  const menuItems = [
    {
      icon: 'person-outline',
      title: 'Edit Profile',
      subtitle: 'Update your personal information',
      action: () => setShowEditProfileModal(true),
    },
    {
      icon: 'people-outline',
      title: 'Manage Groups',
      subtitle: 'View and manage your groups',
      action: () => setShowGroupModal(true),
    },
    {
      icon: 'add-circle-outline',
      title: 'Join Group',
      subtitle: 'Join a group with invite code',
      action: () => setShowJoinModal(true),
    },
    {
      icon: 'card-outline',
      title: 'Payment Methods',
      subtitle: 'Add and manage payment methods',
      action: () => Alert.alert('Coming Soon', 'Payment methods coming soon!'),
    },
    {
      icon: 'download-outline',
      title: 'Export Data',
      subtitle: 'Download your financial data',
      action: () => Alert.alert('Coming Soon', 'Data export coming soon!'),
    },
    {
      icon: 'help-circle-outline',
      title: 'Help & Support',
      subtitle: 'Get help and contact support',
      action: () => Alert.alert('Help', 'For support, email us at support@securefinance.com'),
    },
  ];

  const settingsItems = [
    {
      title: 'Push Notifications',
      subtitle: 'Receive alerts for budgets and expenses',
      value: notifications,
      onToggle: setNotifications,
    },
    {
      title: 'Biometric Authentication',
      subtitle: 'Use fingerprint or face unlock',
      value: biometric,
      onToggle: setBiometric,
    },
    {
      title: 'Dark Mode',
      subtitle: 'Use dark theme throughout the app',
      value: darkMode,
      onToggle: setDarkMode,
    },
    {
      title: 'Auto Sync',
      subtitle: 'Automatically sync data across devices',
      value: autoSync,
      onToggle: setAutoSync,
    },
  ];

  if (!currentUser) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>Please log in to access profile</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#2563EB', '#3B82F6']} style={styles.header}>
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={['#FFFFFF', '#F1F5F9']}
              style={styles.avatarGradient}
            >
              <Text style={styles.avatarText}>{currentUser.name.charAt(0).toUpperCase()}</Text>
            </LinearGradient>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{currentUser.name}</Text>
            <Text style={styles.userEmail}>{currentUser.email}</Text>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>₹{totalExpenses.toFixed(2)}</Text>
            <Text style={styles.statLabel}>Total Spent</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{totalSplitBills}</Text>
            <Text style={styles.statLabel}>Split Bills</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{(groups || []).length}</Text>
            <Text style={styles.statLabel}>Groups</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Groups</Text>
          {(groups || []).map((group) => (
            <TouchableOpacity
              key={group._id}
              style={[
                styles.groupItem,
                selectedGroup?._id === group._id && styles.selectedGroupItem
              ]}
              onPress={() => selectGroup(group)}
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
                  onPress={() => handleShareInvite(group._id)}
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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={item.action}
            >
              <View style={styles.menuIcon}>
                <Ionicons name={item.icon as any} size={24} color="#64748B" />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          {settingsItems.map((item, index) => (
            <View key={index} style={styles.settingItem}>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>{item.title}</Text>
                <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
              </View>
              <Switch
                value={item.value}
                onValueChange={item.onToggle}
                trackColor={{ false: '#E2E8F0', true: '#2563EB' }}
                thumbColor={item.value ? '#FFFFFF' : '#94A3B8'}
              />
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          <TouchableOpacity
            style={styles.securityItem}
            onPress={() => Alert.alert('Security', 'All data is encrypted end-to-end')}
          >
            <View style={styles.securityIcon}>
              <Ionicons name="shield-checkmark" size={20} color="#10B981" />
            </View>
            <Text style={styles.securityText}>End-to-End Encryption Active</Text>
            <View style={styles.securityBadge}>
              <Text style={styles.securityBadgeText}>Secure</Text>
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          disabled={isLoading}
        >
          <Text style={styles.logoutText}>
            {isLoading ? 'Signing Out...' : 'Sign Out'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>Version 1.0.0</Text>
      </ScrollView>

      {/* Create Group Modal */}
      <Modal
        visible={showGroupModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowGroupModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Create Group</Text>
            <TouchableOpacity onPress={handleCreateGroup}>
              <Text style={styles.modalSave}>Create</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Group Name</Text>
              <TextInput
                style={styles.textInput}
                value={groupName}
                onChangeText={setGroupName}
                placeholder="Enter group name"
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={styles.groupsList}>
              <Text style={styles.groupsListTitle}>Your Groups</Text>
              {(groups || []).map((group) => (
                <TouchableOpacity
                  key={group._id}
                  style={[
                    styles.groupItem,
                    selectedGroup?._id === group._id && styles.selectedGroupItem
                  ]}
                  onPress={() => {
                    selectGroup(group);
                    setShowGroupModal(false);
                  }}
                >
                  <View style={styles.groupIcon}>
                    <Text style={styles.groupEmoji}>{group.avatar}</Text>
                  </View>
                  <View style={styles.groupContent}>
                    <Text style={styles.groupTitle}>{group.name}</Text>
                    <Text style={styles.groupSubtitle}>
                      {group.members.length} members • {group.inviteCode}
                    </Text>
                  </View>
                  {selectedGroup?._id === group._id && (
                    <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Join Group Modal */}
      <Modal
        visible={showJoinModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <GroupJoinScreen onClose={() => setShowJoinModal(false)} />
        </SafeAreaView>
      </Modal>

      <EditProfileModal
        visible={showEditProfileModal}
        onClose={() => setShowEditProfileModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatarGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563EB',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    padding: 16,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 16,
  },
  content: {
    flex: 1,
    padding: 20,
  },
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
  menuItem: {
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
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  menuSubtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  settingItem: {
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
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  securityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  securityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  securityText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#166534',
  },
  securityBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  securityBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  logoutButton: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: 'white',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  modalCancel: {
    fontSize: 16,
    color: '#64748B',
  },
  modalSave: {
    fontSize: 16,
    color: '#2563EB',
    fontWeight: '600',
  },
  modalContent: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    color: '#1E293B',
  },
  groupsList: {
    marginTop: 20,
  },
  groupsListTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1E40AF',
    marginLeft: 12,
    lineHeight: 20,
  },
});