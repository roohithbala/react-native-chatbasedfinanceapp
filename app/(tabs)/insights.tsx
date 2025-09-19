import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ColorValue,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import 'react-native-svg'; // Ensure SVG is bundled
import { LineChart, PieChart } from 'react-native-chart-kit';
import { useFinanceStore } from '../../lib/store/financeStore';

const { width: screenWidth } = Dimensions.get('window');

export default function InsightsScreen() {
  const { 
    expenses, 
    budgets, 
    loadExpenses, 
    loadBudgets,
    currentUser,
    loadPredictions,
    loadInsights,
    predictions,
    insights,
    groups
  } = useFinanceStore();
  
  const [isLoading, setIsLoading] = useState(false);
  const [aiInsights, setAiInsights] = useState<any>(null);
  const [aiPredictions, setAiPredictions] = useState<any>(null);
  const [fallbackInsights, setFallbackInsights] = useState<any[]>([]);

  // Load data when component mounts
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      console.log('Loading insights data...');
      setIsLoading(true);
      await Promise.all([
        loadExpenses(),
        loadBudgets(),
        loadAIInsights()
      ]);
      console.log('Insights data loaded successfully');
    } catch (error) {
      console.error('Error loading insights data:', error);
      // Error is already handled in the store, just log here
      // Alert is handled in the store's loadExpenses function
    } finally {
      setIsLoading(false);
    }
  };

  const loadAIInsights = async () => {
    try {
      const [summaryData, predictionsData] = await Promise.all([
        loadInsights(),
        loadPredictions()
      ]);
      
      // The free AI service returns insights and predictions directly
      // No need for complex response format handling
      setAiInsights(Array.isArray(summaryData) ? summaryData : []);
      setAiPredictions(Array.isArray(predictionsData) ? predictionsData : []);
    } catch (error) {
      console.error('Error loading AI data:', error);
      // Use fallback data if AI fails
      setAiInsights([]);
      setAiPredictions([]);
    }
  };

  // Sample data for demo
  // Calculate spending trend from actual expenses
  const spendingTrend = React.useMemo(() => {
    const defaultData = {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [{ data: [0, 0, 0, 0, 0, 0, 0], strokeWidth: 3 }],
    };

    if (!expenses?.length) return defaultData;

    // Group expenses by day and calculate totals
    const dailyTotals = expenses.reduce((acc, expense) => {
      if (!expense?.amount || !expense?.createdAt) return acc;
      const day = new Date(expense.createdAt).getDay();
      acc[day] = (acc[day] || 0) + expense.amount;
      return acc;
    }, Array(7).fill(0));

    return {
      labels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      datasets: [{ data: dailyTotals, strokeWidth: 3 }],
    };
  }, [expenses]);

  const categorySpending = React.useMemo(() => {
    const categories = {
      Food: { color: '#EF4444' },
      Transport: { color: '#3B82F6' },
      Entertainment: { color: '#8B5CF6' },
      Shopping: { color: '#F59E0B' },
      Bills: { color: '#10B981' },
      Health: { color: '#EC4899' },
    };

    if (!expenses?.length) {
      // Return default data if no expenses
      return Object.entries(categories).map(([name, { color }]) => ({
        name,
        population: 0,
        color,
        legendFontColor: '#64748B',
        legendFontSize: 12,
      }));
    }

    // Calculate totals by category
    const totals = expenses.reduce((acc, expense) => {
      if (!expense?.amount || !expense?.category) return acc;
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categories)
      .map(([name, { color }]) => ({
        name,
        population: totals[name] || 0,
        color,
        legendFontColor: '#64748B',
        legendFontSize: 12,
      }))
      .filter(cat => cat.population > 0); // Only show categories with spending
  }, [expenses]);

  // Calculate category totals for budget utilization
  const categoryTotals = React.useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const thisMonthExpenses = expenses.filter((expense: any) => {
      const expenseDate = new Date(expense.createdAt);
      return expenseDate.getMonth() === currentMonth && 
             expenseDate.getFullYear() === currentYear;
    });
    
    return thisMonthExpenses.reduce((acc, expense: any) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);
  }, [expenses]);

  // Calculate real stats for quick overview
  const realStats = React.useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Calculate this month's spending
    const thisMonthExpenses = expenses.filter((expense: any) => {
      const expenseDate = new Date(expense.createdAt);
      return expenseDate.getMonth() === currentMonth &&
             expenseDate.getFullYear() === currentYear;
    });

    const thisMonthTotal = thisMonthExpenses.reduce((sum, expense: any) => sum + expense.amount, 0);

    // Calculate last month's spending
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const lastMonthExpenses = expenses.filter((expense: any) => {
      const expenseDate = new Date(expense.createdAt);
      return expenseDate.getMonth() === lastMonth &&
             expenseDate.getFullYear() === lastMonthYear;
    });

    const lastMonthTotal = lastMonthExpenses.reduce((sum, expense: any) => sum + expense.amount, 0);

    // Calculate percentage change
    const percentageChange = lastMonthTotal > 0
      ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100
      : 0;

    // Calculate total budget and remaining
    const totalBudget = Object.values(budgets).reduce((sum: number, amount: number) => sum + amount, 0);
    const remainingBudget = Math.max(0, totalBudget - thisMonthTotal);

    // Count active groups (groups with recent activity)
    const activeGroups = groups.filter((group: any) => {
      // Consider a group active if it has expenses in the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      return expenses.some((expense: any) =>
        expense.groupId === group._id &&
        new Date(expense.createdAt) > thirtyDaysAgo
      );
    }).length;

    return {
      thisMonthTotal,
      percentageChange,
      activeGroups,
      remainingBudget,
      totalBudget
    };
  }, [expenses, budgets, groups]);

  // Generate real insights based on actual data
  const realInsights = React.useMemo(() => {
    const insights = [];
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Check budget utilization
    Object.entries(budgets).forEach(([category, budgetAmount]: [string, number]) => {
      const spent = categoryTotals[category] || 0;
      const utilization = (spent / budgetAmount) * 100;

      if (utilization > 90) {
        insights.push({
          id: `budget-${category}`,
          title: 'Budget Alert',
          description: `You've used ${utilization.toFixed(1)}% of your ${category} budget`,
          type: 'warning',
          icon: '⚠️',
        });
      } else if (utilization < 50 && spent > 0) {
        insights.push({
          id: `budget-${category}`,
          title: 'Budget Achievement',
          description: `Great job staying under budget for ${category}!`,
          type: 'success',
          icon: '🎉',
        });
      }
    });

    // Add some general tips if no specific insights
    if (insights.length === 0) {
      insights.push({
        id: 'general-tip',
        title: 'Financial Tip',
        description: 'Track your expenses regularly to maintain better financial control',
        type: 'tip',
        icon: '💡',
      });
    }

    return insights;
  }, [expenses, budgets, groups, categoryTotals]);

  const sampleInsights = [
    {
      id: 1,
      title: 'Spending Pattern Alert',
      description: 'Your food expenses have increased by 15% this week',
      type: 'warning',
      icon: '⚠️',
    },
    {
      id: 2,
      title: 'Budget Achievement',
      description: 'Great job! You\'re 20% under your entertainment budget',
      type: 'success',
      icon: '🎉',
    },
    {
      id: 3,
      title: 'Saving Opportunity',
      description: 'Consider brewing coffee at home to save $40/month',
      type: 'tip',
      icon: '💡',
    },
    {
      id: 4,
      title: 'Prediction Alert',
      description: 'You may exceed your monthly budget by $75 at current pace',
      type: 'prediction',
      icon: '🔮',
    },
  ];

  const emotions = [
    { emoji: '😊', label: 'Happy', percentage: 45, color: '#10B981' },
    { emoji: '😐', label: 'Neutral', percentage: 30, color: '#64748B' },
    { emoji: '😟', label: 'Worried', percentage: 20, color: '#F59E0B' },
    { emoji: '😰', label: 'Stressed', percentage: 5, color: '#EF4444' },
  ];

  const getInsightColor = (type: string): [ColorValue, ColorValue] => {
    switch (type) {
      case 'warning': return ['#F59E0B', '#FBBF24'] as [ColorValue, ColorValue];
      case 'success': return ['#10B981', '#34D399'] as [ColorValue, ColorValue];
      case 'tip': return ['#3B82F6', '#60A5FA'] as [ColorValue, ColorValue];
      case 'prediction': return ['#8B5CF6', '#A78BFA'] as [ColorValue, ColorValue];
      default: return ['#64748B', '#94A3B8'] as [ColorValue, ColorValue];
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#1E293B', '#334155']} style={styles.header}>
        <Text style={styles.headerTitle}>AI Insights</Text>
        <Text style={styles.headerSubtitle}>Powered by financial intelligence</Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Spending Trend</Text>
          <View style={styles.chartContainer}>
            <LineChart
              data={spendingTrend}
              width={screenWidth - 60}
              height={200}
              chartConfig={{
                backgroundColor: '#ffffff',
                backgroundGradientFrom: '#ffffff',
                backgroundGradientTo: '#ffffff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
                propsForDots: {
                  r: '4',
                  strokeWidth: '2',
                  stroke: '#2563EB',
                  fill: '#2563EB',
                },
                propsForBackgroundLines: {
                  strokeDasharray: '5,5',
                  stroke: '#E2E8F0',
                },
              }}
              bezier
              style={styles.chart}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Category Breakdown</Text>
          <View style={styles.chartContainer}>
            <PieChart
              data={categorySpending}
              width={screenWidth - 60}
              height={200}
              chartConfig={{
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              }}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Emotional Spending Analysis</Text>
          <View style={styles.emotionContainer}>
            {emotions.map((emotion, index) => (
              <View key={index} style={styles.emotionCard}>
                <Text style={styles.emotionEmoji}>{emotion.emoji}</Text>
                <Text style={styles.emotionLabel}>{emotion.label}</Text>
                <View style={styles.emotionProgressContainer}>
                  <View style={styles.emotionProgressTrack}>
                    <View
                      style={[
                        styles.emotionProgressFill,
                        { 
                          width: `${emotion.percentage}%`,
                          backgroundColor: emotion.color,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.emotionPercentage}>{emotion.percentage}%</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>AI Insights & Predictions</Text>
            <TouchableOpacity 
              style={styles.refreshButton}
              onPress={loadAIInsights}
              disabled={isLoading}
            >
              <Ionicons 
                name="refresh" 
                size={20} 
                color={isLoading ? "#94A3B8" : "#8B5CF6"} 
              />
            </TouchableOpacity>
          </View>
          
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#8B5CF6" />
              <Text style={styles.loadingText}>Analyzing your spending patterns...</Text>
            </View>
          ) : (
            (realInsights.length > 0 ? realInsights : sampleInsights).map((insight: any) => (
              <TouchableOpacity key={insight.id || insight.title} style={styles.insightCard}>
                <LinearGradient
                  colors={getInsightColor(insight.type)}
                  style={styles.insightGradient}
                >
                  <View style={styles.insightHeader}>
                    <Text style={styles.insightEmoji}>{insight.icon}</Text>
                    <Text style={styles.insightTitle}>{insight.title}</Text>
                  </View>
                  <Text style={styles.insightDescription}>{insight.description}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Budget Utilization</Text>
          <View style={styles.budgetContainer}>
            {Object.entries(budgets).map(([category, budgetAmount]) => {
              const spent = categoryTotals[category] || 0;
              const utilization = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0;
              const remaining = Math.max(0, budgetAmount - spent);
              
              return (
                <View key={category} style={styles.budgetItem}>
                  <View style={styles.budgetHeader}>
                    <Text style={styles.budgetCategory}>{category}</Text>
                    <Text style={styles.budgetAmount}>
                      ₹{spent.toFixed(2)} / ₹{budgetAmount.toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.budgetProgressContainer}>
                    <View style={styles.budgetProgressTrack}>
                      <View
                        style={[
                          styles.budgetProgressFill,
                          { 
                            width: `${Math.min(utilization, 100)}%`,
                            backgroundColor: utilization > 90 ? '#EF4444' : 
                                           utilization > 75 ? '#F59E0B' : '#10B981'
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.budgetPercentage}>
                      {utilization.toFixed(1)}%
                    </Text>
                  </View>
                  {remaining > 0 && (
                    <Text style={styles.budgetRemaining}>
                      ₹{remaining.toFixed(2)} remaining
                    </Text>
                  )}
                  {remaining <= 0 && (
                    <Text style={styles.budgetOver}>
                      Over budget by ₹{Math.abs(remaining).toFixed(2)}
                    </Text>
                  )}
                </View>
              );
            })}
            {Object.keys(budgets).length === 0 && (
              <View style={styles.emptyBudget}>
                <Ionicons name="wallet-outline" size={48} color="#D1D5DB" />
                <Text style={styles.emptyBudgetText}>No budgets set yet</Text>
                <Text style={styles.emptyBudgetSubtext}>
                  Set budgets to track your spending limits
                </Text>
              </View>
            )}
          </View>
        </View>
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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 16,
  },
  chartContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  chart: {
    borderRadius: 16,
  },
  emotionContainer: {
    gap: 12,
  },
  emotionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  emotionEmoji: {
    fontSize: 32,
    marginRight: 16,
  },
  emotionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
  },
  emotionProgressContainer: {
    alignItems: 'flex-end',
    flex: 1,
  },
  emotionProgressTrack: {
    width: 80,
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  emotionProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  emotionPercentage: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  insightCard: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  insightGradient: {
    padding: 16,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  insightEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
  },
  insightDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F3E8FF',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
  },
  budgetContainer: {
    gap: 16,
  },
  budgetItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  budgetCategory: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  budgetAmount: {
    fontSize: 14,
    color: '#64748B',
  },
  budgetProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  budgetProgressTrack: {
    flex: 1,
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 12,
  },
  budgetProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  budgetPercentage: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    minWidth: 35,
    textAlign: 'right',
  },
  budgetRemaining: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
  },
  budgetOver: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '500',
  },
  emptyBudget: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  emptyBudgetText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 16,
  },
  emptyBudgetSubtext: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
  },
});