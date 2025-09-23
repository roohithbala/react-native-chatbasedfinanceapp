import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface QuickStatsProps {
  realStats: {
    thisMonthTotal: number;
    percentageChange: number;
    activeGroups: number;
    remainingBudget: number;
  };
}

export const QuickStats: React.FC<QuickStatsProps> = ({ realStats }) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Quick Stats</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <LinearGradient colors={['#EF4444', '#F87171']} style={styles.statGradient}>
            <Ionicons name="trending-up" size={24} color="white" />
            <Text style={styles.statValue}>₹{realStats.thisMonthTotal.toFixed(2)}</Text>
            <Text style={styles.statLabel}>This Month</Text>
          </LinearGradient>
        </View>

        <View style={styles.statCard}>
          <LinearGradient colors={['#10B981', '#34D399']} style={styles.statGradient}>
            <Ionicons
              name={realStats.percentageChange >= 0 ? "trending-up" : "trending-down"}
              size={24}
              color="white"
            />
            <Text style={styles.statValue}>
              {realStats.percentageChange >= 0 ? '+' : ''}{realStats.percentageChange.toFixed(1)}%
            </Text>
            <Text style={styles.statLabel}>vs Last Month</Text>
          </LinearGradient>
        </View>

        <View style={styles.statCard}>
          <LinearGradient colors={['#8B5CF6', '#A78BFA']} style={styles.statGradient}>
            <Ionicons name="people" size={24} color="white" />
            <Text style={styles.statValue}>{realStats.activeGroups}</Text>
            <Text style={styles.statLabel}>Active Groups</Text>
          </LinearGradient>
        </View>

        <View style={styles.statCard}>
          <LinearGradient colors={['#F59E0B', '#FBBF24']} style={styles.statGradient}>
            <Ionicons name="wallet" size={24} color="white" />
            <Text style={styles.statValue}>₹{realStats.remainingBudget.toFixed(2)}</Text>
            <Text style={styles.statLabel}>Remaining Budget</Text>
          </LinearGradient>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statGradient: {
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
});

export default QuickStats;