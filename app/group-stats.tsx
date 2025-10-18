import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet , TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import GroupExpenseStats from './components/GroupExpenseStats';
import { useTheme } from './context/ThemeContext';
import { default as api } from '@/lib/services/api';
import ExpenseScreenHeader from '@/app/components/ExpenseScreenHeader';
import GroupStatsError from './components/GroupStatsError';
import GroupStatsLoading from './components/GroupStatsLoading';
import { getStyles } from '@/lib/styles/groupStatsStyles';

export default function GroupStatsScreen() {
  const { groupId, groupName } = useLocalSearchParams<{
    groupId: string;
    groupName: string;
  }>();
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const [groupExists, setGroupExists] = useState<boolean | null>(null);
  const [checkingGroup, setCheckingGroup] = useState(true);

  useEffect(() => {
    const checkGroupExists = async () => {
      if (!groupId || groupId === 'undefined' || groupId === 'null' || groupId.trim() === '') {
        setGroupExists(false);
        setCheckingGroup(false);
        return;
      }

      try {
        setCheckingGroup(true);
        // Try to fetch the group details to verify it exists
        const response = await api.get(`/groups/${groupId}`);
        if (response.data && response.data.status === 'success') {
          setGroupExists(true);
        } else {
          setGroupExists(false);
        }
      } catch (error: any) {
        console.log('Group check error:', error.response?.status, error.response?.data);
        // If 404, group doesn't exist; if other error, might be auth issue
        if (error.response?.status === 404) {
          setGroupExists(false);
        } else {
          // For other errors (like auth), we'll let the GroupExpenseStats component handle it
          setGroupExists(true);
        }
      } finally {
        setCheckingGroup(false);
      }
    };

    checkGroupExists();
  }, [groupId]);

  if (!groupId) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <GroupStatsError
          type="invalid"
          onBack={() => router.back()}
        />
      </SafeAreaView>
    );
  }

  if (checkingGroup) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <GroupStatsLoading />
      </SafeAreaView>
    );
  }

  if (groupExists === false) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <GroupStatsError
          type="not-found"
          onBack={() => router.back()}
          onGoToChats={() => router.push('/(tabs)/chats')}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ExpenseScreenHeader
        title="Group Statistics"
        subtitle={groupName || 'Group'}
        variant="surface"
      />

      <GroupExpenseStats groupId={groupId} />
    </SafeAreaView>
  );
}