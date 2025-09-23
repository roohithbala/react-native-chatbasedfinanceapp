import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

export default function QuickActions() {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionGrid}>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/(tabs)/expenses')}
        >
          <View style={styles.actionIcon}>
            <Ionicons name="add" size={24} color="#2563EB" />
          </View>
          <Text style={styles.actionTitle}>Add Expense</Text>
          <Text style={styles.actionSubtitle}>Track new spending</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/(tabs)/chats')}
        >
          <View style={styles.actionIcon}>
            <Ionicons name="people" size={24} color="#10B981" />
          </View>
          <Text style={styles.actionTitle}>Group Chat</Text>
          <Text style={styles.actionSubtitle}>Split bills with friends</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/(tabs)/budget')}
        >
          <View style={styles.actionIcon}>
            <Ionicons name="pie-chart" size={24} color="#F59E0B" />
          </View>
          <Text style={styles.actionTitle}>Budget</Text>
          <Text style={styles.actionSubtitle}>Manage your limits</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/(tabs)/insights')}
        >
          <View style={styles.actionIcon}>
            <Ionicons name="trending-up" size={24} color="#8B5CF6" />
          </View>
          <Text style={styles.actionTitle}>Insights</Text>
          <Text style={styles.actionSubtitle}>View analytics</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
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
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
});

export { QuickActions };