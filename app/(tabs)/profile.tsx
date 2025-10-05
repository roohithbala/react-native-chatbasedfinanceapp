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
  RefreshControl,
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
import { Ionicons } from '@expo/vector-icons';
import { useFinanceStore } from '@/lib/store/financeStore';
import biometricAuthService from '@/lib/services/biometricAuthService';
import { useTheme } from '../context/ThemeContext';
import AppFooter from '../components/AppFooter';

export default function ProfileScreen() {
  const [notifications, setNotifications] = useState(true);
  const [biometric, setBiometric] = useState(false);
  const [autoSync, setAutoSync] = useState(true);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
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

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        loadExpenses(),
        loadGroups(),
        getSplitBills(),
        loadBudgets()
      ]);
    } catch (error) {
      console.error('Error refreshing profile data:', error);
    } finally {
      setRefreshing(false);
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
      case 'reminders':
        router.push('/reminders');
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
    color: theme.error,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 14,
    color: theme.textSecondary,
    marginBottom: 20,
  },
});