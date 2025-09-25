import React from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { InsightsHeader } from '../components/InsightsHeader';
import { SpendingTrendChart } from '../components/SpendingTrendChart';
import { CategoryBreakdownChart } from '../components/CategoryBreakdownChart';
import { EmotionalAnalysis } from '../components/EmotionalAnalysis';
import { AIInsightsSection } from '../components/AIInsightsSection';
import { BudgetUtilization } from '../components/BudgetUtilization';
import { QuickStats } from '../components/QuickStats';
import { useInsightsData } from '@/hooks/useInsightsData';
import { useInsightsCalculations } from '@/hooks/useInsightsCalculations';

export default function InsightsScreen() {
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <InsightsHeader />

      <ScrollView style={{ flex: 1, padding: 20 }} showsVerticalScrollIndicator={false}>
        <SpendingTrendChart data={spendingTrend} />

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