import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';

interface BudgetSummaryProps {
  totalBudget: number;
  totalSpent: number;
}

export const BudgetSummary: React.FC<BudgetSummaryProps> = ({
  totalBudget,
  totalSpent,
}) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const remaining = totalBudget - totalSpent;
  const remainingPercentage = totalBudget > 0 ? (remaining / totalBudget) * 100 : 0;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[theme.surface || '#FFFFFF', theme.surfaceSecondary || '#F8FAFC']}
        style={styles.summaryCard}
      >
        <Text style={styles.title}>Budget Overview</Text>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Total Budget</Text>
            <Text style={styles.statValue}>{theme.currency}{totalBudget.toFixed(2)}</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Total Spent</Text>
            <Text style={[styles.statValue, styles.spentValue]}>
              {theme.currency}{totalSpent.toFixed(2)}
            </Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Remaining</Text>
            <Text style={[
              styles.statValue,
              { color: theme.error || '#EF4444' } // Always show remaining in red
            ]}>
              {theme.currency}{remaining.toFixed(2)}
            </Text>
            <Text style={styles.percentageText}>
              {remainingPercentage.toFixed(1)}% left
            </Text>
          </View>
        </View>

        {/* Progress bar for remaining budget */}
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <LinearGradient
              colors={[theme.error || '#EF4444', theme.error || '#F87171']}
              style={[
                styles.progressFill,
                { width: `${Math.min(Math.max(remainingPercentage, 0), 100)}%` },
              ]}
            />
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  summaryCard: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.text || '#1E293B',
    marginBottom: 16,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: theme.textSecondary || '#64748B',
    marginBottom: 4,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text || '#1E293B',
  },
  spentValue: {
    color: theme.error || '#EF4444',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: theme.border || '#E2E8F0',
    marginHorizontal: 12,
  },
  percentageText: {
    fontSize: 10,
    color: theme.textSecondary || '#64748B',
    marginTop: 2,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressTrack: {
    height: 6,
    backgroundColor: theme.surfaceSecondary || '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
});

export default BudgetSummary;