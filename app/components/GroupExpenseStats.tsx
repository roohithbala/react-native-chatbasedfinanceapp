import React, { useState, useEffect } from 'react';
import { Text, StyleSheet } from 'react-native';
import { View, Card } from '@/app/components/ThemedComponents';
import { BarChart, PieChart } from 'react-native-chart-kit';
import GroupExpenseService from '@/app/services/groupExpenseService';

interface GroupExpenseStatsProps {
  groupId: string;
}

export const GroupExpenseStats: React.FC<GroupExpenseStatsProps> = ({ groupId }) => {
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        const data = await GroupExpenseService.getGroupExpenseStats(groupId, period);
        console.log('GroupExpenseStats - Received data:', data);
        console.log('GroupExpenseStats - byCategory:', data.byCategory);
        console.log('GroupExpenseStats - byParticipant:', data.byParticipant);
        setStats(data);
      } catch (error) {
        console.error('Error loading stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [groupId, period]);

  if (loading || !stats) {
    return <Text>Loading statistics...</Text>;
  }

  const categoryData = {
    labels: stats.byCategory.map((cat: any) => cat.category || cat._id || 'Other'),
    datasets: [{
      data: stats.byCategory.map((cat: any) => {
        const amount = cat.amount || cat.totalAmount || 0;
        return isNaN(amount) ? 0 : Number(amount);
      })
    }]
  };

  const participantData = stats.byParticipant.map((part: any) => ({
    name: part.name || part.user?.name || part._id || 'Unknown',
    amount: isNaN(part.amount || part.totalAmount) ? 0 : Number(part.amount || part.totalAmount),
    color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
    legendFontColor: "#7F7F7F",
    legendFontSize: 12
  })).filter((part: any) => part.amount > 0); // Only show participants with amounts > 0

  const chartConfig = {
    backgroundColor: "#ffffff",
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16
    }
  };

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Text style={styles.title}>Overview</Text>
        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>₹{(stats.overview.totalAmount || 0).toFixed(2)}</Text>
            <Text style={styles.statLabel}>Total Amount</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.overview.count}</Text>
            <Text style={styles.statLabel}>Total Expenses</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.overview.settled}</Text>
            <Text style={styles.statLabel}>Settled</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.overview.pending}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
        </View>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.title}>Expenses by Category</Text>
        <BarChart
          data={categoryData}
          width={300}
          height={220}
          chartConfig={chartConfig}
          verticalLabelRotation={30}
          showValuesOnTopOfBars
          yAxisLabel="₹"
          yAxisSuffix=""
        />
      </Card>

      <Card style={styles.card}>
        <Text style={styles.title}>Expenses by Participant</Text>
        {participantData.length > 0 ? (
          <PieChart
            data={participantData}
            width={300}
            height={220}
            chartConfig={chartConfig}
            accessor="amount"
            backgroundColor="transparent"
            paddingLeft="15"
          />
        ) : (
          <View style={styles.emptyChart}>
            <Text style={styles.emptyText}>No participant data available</Text>
            <Text style={styles.emptySubtext}>Add some split bills to see participant breakdown</Text>
          </View>
        )}
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  card: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
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
    color: '#2563EB',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  emptyChart: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
  }
});

export default GroupExpenseStats;
