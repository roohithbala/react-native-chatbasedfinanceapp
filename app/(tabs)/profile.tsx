import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  Modal,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { router, useLocalSearchParams } from 'expo-router';
import EditProfileModal from '@/app/components/EditProfileModal';
import GroupJoinScreen from '@/app/components/GroupJoinScreen';
import ProfileHeader from '@/app/components/ProfileHeader';
import GroupsSection from '@/app/components/GroupsSection';
import AccountSection from '@/app/components/AccountSection';
import SettingsSection from '@/app/components/SettingsSection';
import SecuritySection from '@/app/components/SecuritySection';
import LogoutButton from '@/app/components/LogoutButton';
import { useFinanceStore } from '@/lib/store/financeStore';
import { useTheme } from '../context/ThemeContext';
import getStyles from '@/lib/styles/profileScreenStyles';
import useProfileActions from '../hooks/useProfileActions';
import AppFooter from '../components/AppFooter';

export default function ProfileScreen() {
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const [notifications, setNotifications] = useState(true);
  const [biometric, setBiometric] = useState(false);
  const [autoSync, setAutoSync] = useState(true);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  // refreshing state moved into useProfileActions hook
  const { 
    currentUser, 
    expenses, 
    splitBills, 
    groups, 
    selectedGroup, 
    selectGroup, 
    generateInviteLink,
    logout,
    updateBiometricPreference,
    isLoading,
    loadExpenses,
    loadGroups,
    getSplitBills,
    loadBudgets
  } = useFinanceStore();

  const { themeMode, setThemeMode, theme } = useTheme();
  const styles = getStyles(theme);

  const {
    refreshing,
    handleRefresh,
    handleShareInvite,
    handleLogout,
  } = useProfileActions();

  // Handle menu actions directly
  const handleMenuAction = (action: string) => {
    switch (action) {
      case 'editProfile':
        setShowEditProfileModal(true);
        break;
      case 'reminders':
        router.push('/reminders');
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    if (currentUser?.preferences?.biometric !== undefined) {
      setBiometric(currentUser.preferences.biometric);
    }
  }, [currentUser]);

  // Handle edit profile modal from query parameter
  useEffect(() => {
    if (edit === 'true') {
      setShowEditProfileModal(true);
    }
  }, [edit]);

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

  // handlers moved to useProfileActions hook

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

      <ScrollView 
        style={[styles.content, { backgroundColor: theme.background }]} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
      >
        <GroupsSection
          groups={groups}
          selectedGroup={selectedGroup}
          onSelectGroup={selectGroup}
          onShareInvite={handleShareInvite}
          onJoinGroup={() => setShowJoinModal(true)}
          onEditGroup={(group) => {
            router.push(`/group-settings?groupId=${group._id}&mode=edit`);
          }}
          onDeleteGroup={async (groupId) => {
            router.push(`/group-settings?groupId=${groupId}&mode=settings`);
          }}
          onManageMembers={(group) => {
            router.push(`/group-settings?groupId=${group._id}&mode=members`);
          }}
          onGroupSettings={(group) => {
            router.push(`/group-settings?groupId=${group._id}&mode=settings`);
          }}
        />

        <AccountSection onMenuAction={handleMenuAction} />

        <SettingsSection settingsItems={settingsItems} />

        <SecuritySection />

        <LogoutButton onPress={handleLogout} isLoading={isLoading} />

        <Text style={styles.versionText}>Version 1.0.0</Text>
      </ScrollView>

      <AppFooter />

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

