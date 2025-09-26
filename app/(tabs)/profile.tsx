import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  Platform,
  Share,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import EditProfileModal from '@/app/components/EditProfileModal';
import GroupJoinScreen from '@/app/components/GroupJoinScreen';
import ProfileHeader from '@/app/components/ProfileHeader';
import GroupsSection from '@/app/components/GroupsSection';
import AccountSection from '@/app/components/AccountSection';
import SettingsSection from '@/app/components/SettingsSection';
import SecuritySection from '@/app/components/SecuritySection';
import LogoutButton from '@/app/components/LogoutButton';
import CreateGroupModal from '@/app/components/CreateGroupModal';
import { Ionicons } from '@expo/vector-icons';
import { useFinanceStore } from '@/lib/store/financeStore';
import biometricAuthService from '@/lib/services/biometricAuthService';
import { useTheme } from '../context/ThemeContext';

export default function ProfileScreen() {
  const [notifications, setNotifications] = useState(true);
  const [biometric, setBiometric] = useState(false);
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
    updateBiometricPreference,
    isLoading 
  } = useFinanceStore();

  const { themeMode, setThemeMode, theme } = useTheme();

  useEffect(() => {
    if (currentUser?.preferences?.biometric !== undefined) {
      setBiometric(currentUser.preferences.biometric);
    }
  }, [currentUser]);

  const handleBiometricToggle = async (enabled: boolean) => {
    try {
      await updateBiometricPreference(enabled);
      setBiometric(enabled);
      Alert.alert('Success', `Biometric authentication ${enabled ? 'enabled' : 'disabled'}!`);
    } catch (error: any) {
      console.error('Error toggling biometric:', error);
      Alert.alert('Error', error.message || 'Failed to update biometric settings');
      // Don't revert the toggle since the store method handles the state
    }
  };

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

  const handleMenuAction = (action: string) => {
    switch (action) {
      case 'editProfile':
        setShowEditProfileModal(true);
        break;
      case 'manageGroups':
        setShowGroupModal(true);
        break;
      case 'joinGroup':
        setShowJoinModal(true);
        break;
      default:
        break;
    }
  };

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
      onToggle: handleBiometricToggle,
    },
    {
      title: 'Dark Mode',
      subtitle: 'Use dark theme throughout the app',
      value: themeMode === 'dark',
      onToggle: async () => {
        const newMode = themeMode === 'dark' ? 'light' : 'dark';
        await setThemeMode(newMode);
      },
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
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.centerContent}>
          <Text style={[styles.errorText, { color: theme.error }]}>Please log in to access profile</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ProfileHeader
        currentUser={currentUser}
        totalExpenses={totalExpenses}
        totalSplitBills={totalSplitBills}
        groupsCount={(groups || []).length}
      />

      <ScrollView style={[styles.content, { backgroundColor: theme.background }]} showsVerticalScrollIndicator={false}>
        <GroupsSection
          groups={groups}
          selectedGroup={selectedGroup}
          onSelectGroup={selectGroup}
          onShareInvite={handleShareInvite}
        />

        <AccountSection onMenuAction={handleMenuAction} />

        <SettingsSection settingsItems={settingsItems} />

        <SecuritySection />

        <LogoutButton onPress={handleLogout} isLoading={isLoading} />

        <Text style={styles.versionText}>Version 1.0.0</Text>
      </ScrollView>

      {/* Create Group Modal */}
      <CreateGroupModal
        visible={showGroupModal}
        onClose={() => setShowGroupModal(false)}
        groupName={groupName}
        onGroupNameChange={setGroupName}
        onCreate={handleCreateGroup}
        groups={groups}
        selectedGroup={selectedGroup}
        onSelectGroup={selectGroup}
      />

      {/* Join Group Modal */}
      <Modal
        visible={showJoinModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <GroupJoinScreen onClose={() => setShowJoinModal(false)} />
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
  },
  content: {
    flex: 1,
    padding: 20,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 20,
  },
});