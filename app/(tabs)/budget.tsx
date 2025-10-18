import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BudgetHeaderWrapper from '../components/BudgetHeaderWrapper';
import PeriodSelector from '../components/PeriodSelector';
import { BudgetSummary } from '../components/BudgetSummary';
import { BudgetList } from '../components/BudgetList';
import { BudgetTransactionDetails } from '../components/BudgetTransactionDetails';
import { AddBudgetModal } from '../components/AddBudgetModal';
import ErrorDisplay from '../components/ErrorDisplay';
import LoadingIndicator from '../components/LoadingIndicator';
import { useBudgetData } from '@/hooks/useBudgetData';
import { useBudgetActions } from '@/hooks/useBudgetActions';
import { useBudgetsStore } from '@/lib/store/budgetsStore';
import { useTheme } from '../context/ThemeContext';
import { BudgetAnalytics } from '../components/BudgetAnalytics';
import { BudgetSettingsModal } from '../components/BudgetSettingsModal';
import styles from '@/lib/styles/budgetStyles';
import useBudgetDisplay from '../hooks/useBudgetDisplay';
import ViewModeSelector from '../components/ViewModeSelector';
export default function BudgetScreen() {
  const { theme } = useTheme();
  const {
    budgets,
    expenses,
    categories,
    categoryIcons,
    categoryColors,
    isLoading,
    error,
    getSpentAmount,
    getPersonalSpentAmount,
    getGroupSpentAmount,
    getProgressPercentage,
    getProgressColor,
    loadData,
  } = useBudgetData();

  const {
    showAddModal,
    setShowAddModal,
    category,
    setCategory,
    limit,
    setLimit,
    handleSetBudget,
    handleRetry,
  } = useBudgetActions();

  const {
    historicalBudgets,
    selectedPeriod,
    selectedYear,
    selectedMonth,
    loadHistoricalBudgets,
    loadBudgetTrends
  } = useBudgetsStore();

  const [showTransactionDetails, setShowTransactionDetails] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [categoryExpenses, setCategoryExpenses] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'current' | 'historical'>('current');
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadData();
    } catch (error) {
      console.error('Error refreshing budget data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleCategoryPress = (category: string, expenses: any[]) => {
    setSelectedCategory(category);
    setCategoryExpenses(expenses);
    setShowTransactionDetails(true);
  };
  useEffect(() => {
    loadData();
    loadBudgetTrends();
  }, [loadData, loadBudgetTrends]);

  useEffect(() => {
    if (viewMode === 'historical') {
      const { selectedYear, selectedMonth } = useBudgetsStore.getState();
      if (selectedPeriod === 'yearly') {
        loadHistoricalBudgets({ period: 'yearly', year: selectedYear });
      } else {
        loadHistoricalBudgets({ period: 'monthly', year: selectedYear, month: selectedMonth });
      }
    }
  }, [selectedPeriod, viewMode, selectedYear, selectedMonth, loadHistoricalBudgets]);

  const { displayBudgetsData, displayTotals } = useBudgetDisplay({
    viewMode,
    budgets,
    historicalBudgets,
    selectedPeriod,
    selectedYear,
    selectedMonth,
  });

  const { totalBudget: displayTotalBudget, totalSpent: displayTotalSpent } = displayTotals;

  if (isLoading) {
    return <LoadingIndicator loading={true} message="Loading budgets..." />;
  }

  if (error) {
    return (
      <ErrorDisplay
        error={error}
        onRetry={handleRetry}
      />
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <BudgetHeaderWrapper />

      <View style={styles.headerActions}>
        <TouchableOpacity
          style={[styles.analyticsButton, { backgroundColor: theme.primary }]}
          onPress={() => setShowAnalytics(true)}
        >
          <Text style={styles.analyticsButtonText}>Analytics</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.settingsButton, { backgroundColor: theme.card, borderColor: theme.border }]}
          onPress={() => setShowSettings(true)}
        >
          <Text style={[styles.settingsButtonText, { color: theme.text }]}>⚙️ Settings</Text>
        </TouchableOpacity>
      </View>

      <ViewModeSelector viewMode={viewMode} setViewMode={setViewMode} theme={theme} />
      {viewMode === 'historical' && <PeriodSelector />}

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <BudgetSummary
          totalBudget={typeof displayTotalBudget === 'number' ? displayTotalBudget : 0}
          totalSpent={typeof displayTotalSpent === 'number' ? displayTotalSpent : 0}
        />

        <View style={styles.categoriesSection}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            {viewMode === 'historical' ? 'Historical Category Budgets' : 'Category Budgets'}
          </Text>

          <BudgetList
            categories={categories}
            budgets={displayBudgetsData}
            categoryIcons={categoryIcons}
            categoryColors={categoryColors}
            getSpentAmount={getSpentAmount}
            getPersonalSpentAmount={getPersonalSpentAmount}
            getGroupSpentAmount={getGroupSpentAmount}
            getProgressPercentage={getProgressPercentage}
            getProgressColor={getProgressColor}
            onAddPress={() => setShowAddModal(true)}
            onCategoryPress={handleCategoryPress}
            expenses={expenses}
          />
        </View>
      </ScrollView>

      <AddBudgetModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleSetBudget}
        category={category}
        onCategoryChange={setCategory}
        limit={limit}
        onLimitChange={setLimit}
        categories={categories}
        categoryIcons={categoryIcons}
      />

      {showTransactionDetails && (
        <BudgetTransactionDetails
          category={selectedCategory}
          expenses={categoryExpenses}
          categoryIcon={categoryIcons[selectedCategory as keyof typeof categoryIcons]}
          categoryColors={categoryColors[selectedCategory as keyof typeof categoryColors] as [string, string]}
          onClose={() => setShowTransactionDetails(false)}
        />
      )}

      {showAnalytics && (
        <View style={[styles.analyticsModal, { backgroundColor: theme.background }]}>
          <BudgetAnalytics onClose={() => setShowAnalytics(false)} />
        </View>
      )}

      <BudgetSettingsModal
        visible={showSettings}
        onClose={() => {
          setShowSettings(false);
          loadData(); // Reload data after settings changes
        }}
      />
    </SafeAreaView>
  );
}