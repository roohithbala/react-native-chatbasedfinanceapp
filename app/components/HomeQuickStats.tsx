import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface HomeQuickStatsProps {
  totalExpensesThisMonth: number;
  totalOwed: number;
}

export default function HomeQuickStats({ totalExpensesThisMonth, totalOwed }: HomeQuickStatsProps) {
  return (
    <View style={styles.statsContainer}>
      <View style={styles.statCard}>
        <LinearGradient
          colors={['#10B981', '#059669']}
          style={styles.statGradient}
        >
          <Ionicons name="wallet" size={24} color="white" />
          <Text style={styles.statAmount}>
            ${totalExpensesThisMonth.toFixed(2)}
          </Text>
          <Text style={styles.statLabel}>This Month</Text>
        </LinearGradient>
      </View>

      <View style={styles.statCard}>
        <LinearGradient
          colors={['#F59E0B', '#D97706']}
          style={styles.statGradient}
        >
          <Ionicons name="time" size={24} color="white" />
          <Text style={styles.statAmount}>
            ${totalOwed.toFixed(2)}
          </Text>
          <Text style={styles.statLabel}>You Owe</Text>
        </LinearGradient>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: -12,
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statGradient: {
    padding: 20,
    alignItems: 'center',
  },
  statAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginVertical: 8,
  },
  statLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
});

export { HomeQuickStats };