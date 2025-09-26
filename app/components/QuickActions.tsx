import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

export default function QuickActions() {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionGrid}>
        <TouchableOpacity
          style={[styles.actionCard, { backgroundColor: theme.surface }]}
          onPress={() => router.push('/(tabs)/expenses')}
        >
          <View style={styles.actionIcon}>
            <Ionicons name="add" size={24} color={theme.primary} />
          </View>
          <Text style={styles.actionTitle}>Add Expense</Text>
          <Text style={styles.actionSubtitle}>Track new spending</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionCard, { backgroundColor: theme.surface }]}
          onPress={() => router.push('/(tabs)/chats')}
        >
          <View style={styles.actionIcon}>
            <Ionicons name="people" size={24} color={theme.success} />
          </View>
          <Text style={styles.actionTitle}>Group Chat</Text>
          <Text style={styles.actionSubtitle}>Split bills with friends</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionCard, { backgroundColor: theme.surface }]}
          onPress={() => router.push('/(tabs)/budget')}
        >
          <View style={styles.actionIcon}>
            <Ionicons name="pie-chart" size={24} color={theme.warning} />
          </View>
          <Text style={styles.actionTitle}>Budget</Text>
          <Text style={styles.actionSubtitle}>Manage your limits</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionCard, { backgroundColor: theme.surface }]}
          onPress={() => router.push('/(tabs)/insights')}
        >
          <View style={styles.actionIcon}>
            <Ionicons name="trending-up" size={24} color={theme.primary} />
          </View>
          <Text style={styles.actionTitle}>Insights</Text>
          <Text style={styles.actionSubtitle}>View analytics</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 16,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: (width - 52) / 2,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 12,
    color: theme.textSecondary,
    textAlign: 'center',
  },
});

export { QuickActions };