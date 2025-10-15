import React, { useState, useEffect } from 'react';
import { Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { View } from '@/app/components/ThemedComponents';
import { BarChart, PieChart } from 'react-native-chart-kit';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { GroupExpenseService } from '@/lib/services/groupExpenseService';
import { useTheme } from '../context/ThemeContext';

const { width: screenWidth } = Dimensions.get('window');

interface GroupExpenseStatsProps {
  groupId: string;
}

export const GroupExpenseStats: React.FC<GroupExpenseStatsProps> = ({ groupId }) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        const data = await GroupExpenseService.getGroupExpenseStats(groupId, period);
        console.log('📊 GroupExpenseStats - Received data for period:', period);
        console.log('📊 Overview:', data.overview);
        console.log('📊 Total Amount:', data.overview?.totalAmount);
        console.log('📊 Count:', data.overview?.count);
        console.log('📊 Settled:', data.overview?.settled);
        console.log('📊 Pending:', data.overview?.pending);
        console.log('📊 byCategory:', data.byCategory);
        console.log('📊 byParticipant:', data.byParticipant);
        setStats(data);
      } catch (error) {
        console.error('❌ Error loading stats:', error);
        // Set fallback empty stats to prevent crashes
        setStats({
          overview: {
            totalAmount: 0,
            count: 0,
            settled: 0,
            pending: 0
          },
          byCategory: [],
          byParticipant: []
        });
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [groupId, period]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
          Analyzing group expenses...
        </Text>
      </View>
    );
  }

  if (!stats) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="stats-chart-outline" size={64} color={theme.textSecondary} />
        <Text style={[styles.errorText, { color: theme.text }]}>
          Unable to load statistics
        </Text>
        <Text style={[styles.errorSubtext, { color: theme.textSecondary }]}>
          Please try again later
        </Text>
      </View>
    );
  }

  const categoryData = {
    labels: (stats.byCategory || [])
      .filter((cat: any) => cat && (cat.amount > 0 || cat.totalAmount > 0))
      .slice(0, 6) // Limit to top 6 categories
      .map((cat: any) => {
        const label = cat.category || cat._id || 'Other';
        return label.length > 8 ? label.substring(0, 8) + '...' : label;
      }),
    datasets: [{
      data: (stats.byCategory || [])
        .filter((cat: any) => cat && (cat.amount > 0 || cat.totalAmount > 0))
        .slice(0, 6)
        .map((cat: any) => {
          const amount = cat.amount || cat.totalAmount || 0;
          return isNaN(amount) ? 0 : Number(amount);
        }).concat(stats.byCategory?.length === 0 ? [0] : []) // Add 0 if empty to prevent chart crash
    }]
  };

  const participantData = (stats.byParticipant || [])
    .filter((part: any) => part && (part.amount > 0 || part.totalAmount > 0))
    .slice(0, 8) // Limit to top 8 participants
    .map((part: any, index: number) => {
      let name = 'Unknown';
      let amount = 0;

      if (part) {
        name = part.name || part.user?.name || part._id || 'Unknown';
        amount = isNaN(part.amount || part.totalAmount) ? 0 : Number(part.amount || part.totalAmount);
      }

      const colors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
        '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
      ];

      return {
        name: name.length > 10 ? name.substring(0, 10) + '...' : name,
        amount,
        color: colors[index % colors.length],
        legendFontColor: theme.textSecondary || "#7F7F7F",
        legendFontSize: 12
      };
    })
    .filter((part: any) => part && part.amount > 0);

  const chartConfig = {
    backgroundColor: 'transparent',
    backgroundGradientFrom: theme.surface || "#ffffff",
    backgroundGradientTo: theme.surface || "#ffffff",
    color: (opacity = 1) => `rgba(${theme.primary ? parseInt(theme.primary.slice(1, 3), 16) : 37}, ${theme.primary ? parseInt(theme.primary.slice(3, 5), 16) : 99}, ${theme.primary ? parseInt(theme.primary.slice(5, 7), 16) : 235}, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(${theme.text ? parseInt(theme.text.slice(1, 3), 16) : 0}, ${theme.text ? parseInt(theme.text.slice(3, 5), 16) : 0}, ${theme.text ? parseInt(theme.text.slice(5, 7), 16) : 0}, ${opacity})`,
    style: {
      borderRadius: 16
    },
    propsForLabels: {
      fontSize: 12,
      fontWeight: '600'
    }
  };

  const periodOptions = [
    { key: 'week', label: 'Week', icon: 'calendar-outline' },
    { key: 'month', label: 'Month', icon: 'calendar' },
    { key: 'year', label: 'Year', icon: 'calendar-clear' }
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Period Selector */}
      <View style={styles.periodSelector}>
        {periodOptions.map((option) => (
          <TouchableOpacity
            key={option.key}
            style={[
              styles.periodButton,
              period === option.key && styles.periodButtonActive
            ]}
            onPress={() => setPeriod(option.key as 'week' | 'month' | 'year')}
          >
            <Ionicons
              name={option.icon as any}
              size={16}
              color={period === option.key ? 'white' : theme.textSecondary}
            />
            <Text style={[
              styles.periodButtonText,
              period === option.key && styles.periodButtonTextActive
            ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Overview Cards */}
      <View style={styles.overviewGrid}>
        <LinearGradient
          colors={['#667EEA', '#764BA2']}
          style={styles.overviewCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={[styles.cardContent, { backgroundColor: 'transparent' }]}>
            <Ionicons name="cash" size={24} color="white" />
            <Text style={styles.overviewValue}>
              ₹{(stats.overview?.totalAmount || 0).toFixed(2)}
            </Text>
            <Text style={styles.overviewLabel}>Total Spent</Text>
          </View>
        </LinearGradient>

        <LinearGradient
          colors={['#F093FB', '#F5576C']}
          style={styles.overviewCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={[styles.cardContent, { backgroundColor: 'transparent' }]}>
            <Ionicons name="receipt" size={24} color="white" />
            <Text style={styles.overviewValue}>
              {stats.overview?.count || 0}
            </Text>
            <Text style={styles.overviewLabel}>Transactions</Text>
          </View>
        </LinearGradient>

        <LinearGradient
          colors={['#4ECDC4', '#44A08D']}
          style={styles.overviewCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={[styles.cardContent, { backgroundColor: 'transparent' }]}>
            <Ionicons name="checkmark-circle" size={24} color="white" />
            <Text style={styles.overviewValue}>
              {stats.overview?.settled || 0}
            </Text>
            <Text style={styles.overviewLabel}>Settled</Text>
          </View>
        </LinearGradient>

        <LinearGradient
          colors={['#FF9A9E', '#FECFEF']}
          style={styles.overviewCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={[styles.cardContent, { backgroundColor: 'transparent' }]}>
            <Ionicons name="time" size={24} color="white" />
            <Text style={styles.overviewValue}>
              {stats.overview?.pending || 0}
            </Text>
            <Text style={styles.overviewLabel}>Pending</Text>
          </View>
        </LinearGradient>
      </View>

      {/* Category Breakdown */}
      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <Ionicons name="pie-chart" size={20} color={theme.primary} />
          <Text style={[styles.chartTitle, { color: theme.text }]}>Spending by Category</Text>
        </View>
        {categoryData.labels.length > 0 && categoryData.datasets[0].data.length > 0 && categoryData.datasets[0].data.some((val: number) => val > 0) ? (
          <BarChart
            data={categoryData}
            width={screenWidth - 64}
            height={240}
            chartConfig={chartConfig}
            verticalLabelRotation={30}
            showValuesOnTopOfBars
            yAxisLabel="₹"
            yAxisSuffix=""
            style={styles.chart}
          />
        ) : (
          <View style={styles.emptyChart}>
            <Ionicons name="bar-chart-outline" size={48} color={theme.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              No category data available
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
              Add some expenses to see category breakdown
            </Text>
          </View>
        )}
      </View>

      {/* Participant Breakdown */}
      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <Ionicons name="people" size={20} color={theme.primary} />
          <Text style={[styles.chartTitle, { color: theme.text }]}>Spending by Member</Text>
        </View>
        {participantData.length > 0 ? (
          <PieChart
            data={participantData}
            width={screenWidth - 64}
            height={240}
            chartConfig={chartConfig}
            accessor="amount"
            backgroundColor="transparent"
            paddingLeft="15"
            style={styles.chart}
          />
        ) : (
          <View style={styles.emptyChart}>
            <Ionicons name="people-outline" size={48} color={theme.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              No member data available
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
              Add some split bills to see member breakdown
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    padding: 16,
    paddingTop: 20, // Additional top padding to prevent hiding behind headers
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: theme.border,
  },
  periodButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  periodButtonActive: {
    backgroundColor: theme.primary,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.textSecondary,
  },
  periodButtonTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  overviewCard: {
    flex: 1,
    minWidth: (screenWidth - 64) / 2,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardContent: {
    alignItems: 'center',
  },
  overviewValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 8,
    marginBottom: 4,
  },
  overviewLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
    textAlign: 'center',
  },
  chartCard: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  chart: {
    borderRadius: 12,
    marginVertical: 8,
  },
  emptyChart: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.surfaceSecondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    borderStyle: 'dashed',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  // Legacy styles (keeping for compatibility)
  card: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: theme.surface,
    borderColor: theme.border,
    borderWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: theme.text,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  statItem: {
    alignItems: 'center',
    minWidth: '45%',
    marginBottom: 16,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.primary || '#2563EB',
  },
  statLabel: {
    fontSize: 12,
    color: theme.textSecondary || '#666',
    marginTop: 4,
  },
});

export default GroupExpenseStats;
