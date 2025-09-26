import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { router } from 'expo-router';

interface HomeQuickStatsProps {
  totalExpensesThisMonth: number;
  totalOwed: number;
}

export default function HomeQuickStats({ totalExpensesThisMonth, totalOwed }: HomeQuickStatsProps) {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  return (
    <View style={[styles.statsContainer, { backgroundColor: theme.background }]}>
      <TouchableOpacity style={styles.statCard} onPress={() => router.push('/(tabs)/expenses')}>
        <LinearGradient
          colors={[theme.success, theme.success + 'CC']}
          style={styles.statGradient}
        >
          <Ionicons name="wallet" size={24} color={theme.surface} />
          <Text style={styles.statAmount}>
            {theme.currency}{totalExpensesThisMonth.toFixed(2)}
          </Text>
          <Text style={styles.statLabel}>This Month</Text>
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity style={styles.statCard} onPress={() => router.push('/you-owe')}>
        <LinearGradient
          colors={[theme.warning, theme.warning + 'CC']}
          style={styles.statGradient}
        >
          <Ionicons name="time" size={24} color={theme.surface} />
          <Text style={styles.statAmount}>
            {theme.currency}{totalOwed.toFixed(2)}
          </Text>
          <Text style={styles.statLabel}>You Owe</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
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
    color: theme.surface,
    marginVertical: 8,
  },
  statLabel: {
    fontSize: 14,
    color: theme.surfaceSecondary,
  },
});

export { HomeQuickStats };