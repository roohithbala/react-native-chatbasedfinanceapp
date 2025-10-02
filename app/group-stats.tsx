import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';
import GroupExpenseStats from './components/GroupExpenseStats';
import { useTheme } from './context/ThemeContext';
import { default as api } from '@/lib/services/api';

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
        <View style={styles.errorContainer}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <View style={styles.errorContent}>
            <Ionicons name="alert-circle" size={64} color={theme.error} />
            <Text style={[styles.errorTitle, { color: theme.text }]}>Invalid Group</Text>
            <Text style={[styles.errorText, { color: theme.textSecondary }]}>
              No group ID provided. Please go back and try again.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (checkingGroup) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.centerContent}>
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Checking group...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (groupExists === false) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.errorContainer}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <View style={styles.errorContent}>
            <Ionicons name="alert-circle" size={64} color={theme.error} />
            <Text style={[styles.errorTitle, { color: theme.text }]}>Group Not Found</Text>
            <Text style={[styles.errorText, { color: theme.textSecondary }]}>
              This group no longer exists or you don't have access to it.
            </Text>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: theme.primary }]}
              onPress={() => router.push('/(tabs)/chats')}
            >
              <Text style={[styles.retryButtonText, { color: theme.surface }]}>Go to Chats</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Group Statistics</Text>
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
            {groupName || 'Group'}
          </Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <GroupExpenseStats groupId={groupId} />
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
  },
  loadingText: {
    fontSize: 16,
    color: theme.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  placeholder: {
    width: 40,
  },
  errorContainer: {
    flex: 1,
  },
  errorContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  retryButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});