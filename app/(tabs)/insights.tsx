import React from 'react';
import { ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { InsightsHeader } from '../components/InsightsHeader';
import { SpendingTrendChart } from '../components/SpendingTrendChart';
import { CategoryBreakdownChart } from '../components/CategoryBreakdownChart';
import { EmotionalAnalysis } from '../components/EmotionalAnalysis';
import { AIInsightsSection } from '../components/AIInsightsSection';
import { BudgetUtilization } from '../components/BudgetUtilization';
import { QuickStats } from '../components/QuickStats';
import PreviousMonthSpendings from '../components/PreviousMonthSpendings';
import { useInsightsData } from '@/hooks/useInsightsData';
import { useInsightsCalculations } from '@/hooks/useInsightsCalculations';
import { useTheme } from '../context/ThemeContext';

export default function InsightsScreen() {
  const { theme } = useTheme();
  const [refreshing, setRefreshing] = React.useState(false);
  const {
    expenses,
    budgets,
    groups,
    isLoading,
    aiInsights,
    loadAIInsights,
  } = useInsightsData();

  const {
    spendingTrend,
    categorySpending,
    categoryTotals,
    realStats,
    realInsights,
  } = useInsightsCalculations(expenses, budgets, groups);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadAIInsights();
    } catch (error) {
      console.error('Error refreshing insights:', error);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <InsightsHeader />

      <ScrollView style={{ flex: 1, padding: 20, backgroundColor: theme.background }} showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <SpendingTrendChart data={spendingTrend} />

        <PreviousMonthSpendings expenses={expenses} />

        <CategoryBreakdownChart data={categorySpending} />

        <EmotionalAnalysis />

        <AIInsightsSection
          isLoading={isLoading}
          insights={realInsights}
          onRefresh={loadAIInsights}
        />

        <BudgetUtilization
          budgets={budgets}
          categoryTotals={categoryTotals}
        />

        <QuickStats realStats={realStats} />
      </ScrollView>
    </SafeAreaView>
  );
}