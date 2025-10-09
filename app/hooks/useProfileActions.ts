import { useCallback, useState } from 'react';
import { Alert, Platform, Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useFinanceStore } from '@/lib/store/financeStore';

export default function useProfileActions() {
  const {
    groups,
    generateInviteLink,
    logout,
    loadExpenses,
    loadGroups,
    getSplitBills,
    loadBudgets,
  } = useFinanceStore();

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        loadExpenses(),
        loadGroups(),
        getSplitBills(),
        loadBudgets(),
      ]);
    } catch (error) {
      console.error('Error refreshing profile data:', error);
    } finally {
      setRefreshing(false);
    }
  }, [loadExpenses, loadGroups, getSplitBills, loadBudgets]);

  const handleShareInvite = useCallback(async (groupId: string) => {
    const group = groups.find((g: any) => g._id === groupId);
    if (!group) return;

    const inviteLink = generateInviteLink(groupId);
    const message = `Join my SecureFinance group "${group.name}"!\n\nInvite Code: ${group.inviteCode}\nLink: ${inviteLink}`;

    try {
      if (Platform.OS === 'web') {
        await Clipboard.setStringAsync(message);
        Alert.alert('Copied!', 'Invite link copied to clipboard');
      } else {
        await Share.share({ message, title: `Join ${group.name} on SecureFinance` });
      }
    } catch (error) {
      console.error('Share error:', error);
      Alert.alert('Error', 'Failed to share invite');
    }
  }, [groups, generateInviteLink]);

  const handleLogout = useCallback(() => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
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
        },
      },
    ]);
  }, [logout]);

  return {
    refreshing,
    handleRefresh,
    handleShareInvite,
    handleLogout,
  };
}
