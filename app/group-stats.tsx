import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';
import GroupExpenseStats from './components/GroupExpenseStats';
import { useTheme } from './context/ThemeContext';

export default function GroupStatsScreen() {
  const { groupId, groupName } = useLocalSearchParams<{
    groupId: string;
    groupName: string;
  }>();
  const { theme } = useTheme();
  const styles = getStyles(theme);

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
});