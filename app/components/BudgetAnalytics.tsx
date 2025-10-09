import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useBudgetsStore } from '@/lib/store/budgetsStore';

interface MonthlyTrend {
  month: string;
  totalBudget: number;
  totalSpent: number;
  categories: number;
  overspentCategories: number;
  utilization: number;
}

interface CategoryTrend {
  category: string;
  totalBudget: number;
  totalSpent: number;
  averageUtilization: number;
  overspentCount: number;
  periods: number;
}

interface OverallMetrics {
  averageBudgetUtilization: number;
  totalBudgets: number;
  totalOverspent: number;
  bestCategory: string | null;
  worstCategory: string | null;
}

interface BudgetTrends {
  monthlyTrends: MonthlyTrend[];
  categoryTrends: Record<string, CategoryTrend>;
  overallMetrics: OverallMetrics;
}

interface BudgetAnalyticsProps {
  onClose: () => void;
}

export const BudgetAnalytics: React.FC<BudgetAnalyticsProps> = ({ onClose }) => {
  const { theme } = useTheme();
  const { budgetTrends } = useBudgetsStore();

  // The budgetTrends from the store contains the trends data directly
  const trendsData = budgetTrends;

  if (!trendsData || !trendsData.overallMetrics) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { backgroundColor: theme.card }]}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <Text style={[styles.backButtonText, { color: theme.primary }]}>← Back</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.text }]}>Budget Analytics</Text>
          <View style={styles.headerSpacer} />
        </View>
        <Text style={[styles.noData, { color: theme.textSecondary }]}>
          No budget data available for analytics
        </Text>
      </View>
    );
  }

  const { monthlyTrends, categoryTrends, overallMetrics } = trendsData as BudgetTrends;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.card }]}>
        <TouchableOpacity onPress={onClose} style={styles.backButton}>
          <Text style={[styles.backButtonText, { color: theme.primary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>Budget Analytics</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Overall Metrics */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Overall Performance</Text>
        <View style={styles.metricsGrid}>
          <View style={styles.metric}>
            <Text style={[styles.metricValue, { color: theme.primary }]}>
              {overallMetrics.averageBudgetUtilization.toFixed(1)}%
            </Text>
            <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>
              Avg Utilization
            </Text>
          </View>
          <View style={styles.metric}>
            <Text style={[styles.metricValue, { color: theme.primary }]}>
              {overallMetrics.totalBudgets}
            </Text>
            <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>
              Total Budgets
            </Text>
          </View>
          <View style={styles.metric}>
            <Text style={[styles.metricValue, { color: theme.error }]}>
              {overallMetrics.totalOverspent}
            </Text>
            <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>
              Overspent
            </Text>
          </View>
        </View>
      </View>

      {/* Best/Worst Categories */}
      <View style={[styles.section, { backgroundColor: theme.card }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Category Performance</Text>
        <View style={styles.categoryInsights}>
          {overallMetrics.bestCategory && (
            <View style={styles.insight}>
              <Text style={[styles.insightLabel, { color: theme.textSecondary }]}>
                Best Performing:
              </Text>
              <Text style={[styles.insightValue, { color: theme.success }]}>
                {overallMetrics.bestCategory}
              </Text>
            </View>
          )}
          {overallMetrics.worstCategory && (
            <View style={styles.insight}>
              <Text style={[styles.insightLabel, { color: theme.textSecondary }]}>
                Needs Attention:
              </Text>
              <Text style={[styles.insightValue, { color: theme.error }]}>
                {overallMetrics.worstCategory}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Monthly Trends */}
      {monthlyTrends && monthlyTrends.length > 0 && (
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Monthly Trends</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.trendsContainer}>
              {monthlyTrends.slice(-6).map((trend: MonthlyTrend, index: number) => (
                <View key={trend.month} style={styles.trendItem}>
                  <Text style={[styles.trendMonth, { color: theme.text }]}>
                    {trend.month}
                  </Text>
                  <View style={styles.trendBar}>
                    <View
                      style={[
                        styles.trendBarFill,
                        {
                          height: `${Math.min(trend.utilization, 100)}%`,
                          backgroundColor: trend.utilization > 100 ? theme.error : theme.primary
                        }
                      ]}
                    />
                  </View>
                  <Text style={[styles.trendValue, { color: theme.textSecondary }]}>
                    {trend.utilization.toFixed(0)}%
                  </Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Category Breakdown */}
      {categoryTrends && Object.keys(categoryTrends).length > 0 && (
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Category Breakdown</Text>
          {Object.values(categoryTrends).map((category: any) => (
            <View key={category.category} style={styles.categoryItem}>
              <View style={styles.categoryHeader}>
                <Text style={[styles.categoryName, { color: theme.text }]}>
                  {category.category}
                </Text>
                <Text style={[styles.categoryUtilization, { color: theme.textSecondary }]}>
                  {category.averageUtilization.toFixed(1)}%
                </Text>
              </View>
              <View style={styles.categoryProgress}>
                <View
                  style={[
                    styles.categoryProgressFill,
                    {
                      width: `${Math.min(category.averageUtilization, 100)}%`,
                      backgroundColor: category.averageUtilization > 100 ? theme.error : theme.primary
                    }
                  ]}
                />
              </View>
              <View style={styles.categoryStats}>
                <Text style={[styles.categoryStat, { color: theme.textSecondary }]}>
                  ${category.totalSpent.toFixed(2)} spent
                </Text>
                <Text style={[styles.categoryStat, { color: theme.textSecondary }]}>
                  ${category.totalBudget.toFixed(2)} budgeted
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50, // Account for status bar
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 50, // Same width as back button for centering
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  noData: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  metric: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  metricLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  categoryInsights: {
    gap: 12,
  },
  insight: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  insightLabel: {
    fontSize: 16,
  },
  insightValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  trendsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  trendItem: {
    alignItems: 'center',
    minWidth: 60,
  },
  trendMonth: {
    fontSize: 12,
    marginBottom: 8,
  },
  trendBar: {
    height: 80,
    width: 20,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 10,
    justifyContent: 'flex-end',
  },
  trendBarFill: {
    borderRadius: 10,
    minHeight: 2,
  },
  trendValue: {
    fontSize: 10,
    marginTop: 4,
  },
  categoryItem: {
    marginBottom: 16,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '500',
  },
  categoryUtilization: {
    fontSize: 14,
  },
  categoryProgress: {
    height: 8,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 4,
    marginBottom: 8,
  },
  categoryProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  categoryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  categoryStat: {
    fontSize: 12,
  },
});

export default BudgetAnalytics;