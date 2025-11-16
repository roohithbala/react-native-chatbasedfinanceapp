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
    getMonthlySpentAmount,
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

  const handleCategoryPress = (category: string, passedExpenses: any[]) => {
    // Defensive: sometimes BudgetList passes an empty array for historical periods
    // Try multiple fallbacks so transactions are shown when available
    const categoryKey = category;
    let categoryListExpenses: any[] = Array.isArray(passedExpenses) ? passedExpenses : [];

    // If empty and we're in historical view, try the flattened historical array
    if ((!categoryListExpenses || categoryListExpenses.length === 0) && viewMode === 'historical') {
      categoryListExpenses = historicalExpensesArray.filter((e: any) => {
        if (!e) return false;
        const cat = e.category || e.categoryName || e.categoryKey || (e.tags && e.tags[0]);
        if (typeof cat === 'string' && cat.toLowerCase() === categoryKey.toLowerCase()) return true;
        // match by exact equality as a fallback
        return e.category === categoryKey;
      });
    }

    // Final fallback: search global `expenses` (current data) but restrict by the selected period
    if ((!categoryListExpenses || categoryListExpenses.length === 0)) {
      categoryListExpenses = (expenses || []).filter((e: any) => {
        if (!e) return false;
        const cat = e.category || e.categoryName || e.categoryKey;
        const matchesCategory = typeof cat === 'string' ? cat.toLowerCase() === categoryKey.toLowerCase() : cat === categoryKey;
        if (!matchesCategory) return false;

        // Restrict results to the selected period for both current and historical views
        // For current view, selectedYear/selectedMonth default to the current month in the store
        const d = new Date(e.createdAt);
        if (selectedPeriod === 'yearly') {
          return d.getFullYear() === selectedYear;
        }
        return d.getFullYear() === selectedYear && (d.getMonth() + 1) === selectedMonth;
      });
    }

    setSelectedCategory(category);
    setCategoryExpenses(categoryListExpenses || []);
    setShowTransactionDetails(true);
  };
  useEffect(() => {
    loadData();
    loadBudgetTrends();
  }, [loadData, loadBudgetTrends]);

  useEffect(() => {
    if (viewMode === 'historical') {
      // Use the selectedYear/selectedMonth values from the current render
      // (avoid reading store via getState which can return stale values during renders)
      console.log('📡 Requesting historical budgets with params:', { selectedPeriod, selectedYear, selectedMonth });
      if (selectedPeriod === 'yearly') {
        loadHistoricalBudgets({ period: 'yearly', year: selectedYear });
      } else {
        loadHistoricalBudgets({ period: 'monthly', year: selectedYear, month: selectedMonth });
      }
    }
  }, [selectedPeriod, viewMode, selectedYear, selectedMonth, loadHistoricalBudgets]);

  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  // Build periodKey to lookup historical data
  const periodKey = selectedPeriod === 'yearly' ?
    selectedYear.toString() : `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}`;

  // Resolve period data: use exact period key if present, else synthesize an empty period object
  let periodData: any = null;
  if (historicalBudgets && typeof historicalBudgets === 'object') {
    periodData = historicalBudgets[periodKey] ?? null;
  }

  if (!periodData) {
    // No data for requested periodKey — synthesize a safe empty period structure so the UI can render
    periodData = {
      budgets: {},
      totals: { totalAmount: 0, totalSpent: 0 },
      detailedBudgets: [],
      expenses: [],
    };
    console.log('ℹ️ No historical period data found for', periodKey, '. Available keys:', historicalBudgets ? Object.keys(historicalBudgets) : []);
  }

  // Flatten detailedExpenses from periodData for easier access by BudgetList
  // Support several possible key names that the backend might return
  const detailedCandidates = periodData?.detailedBudgets || periodData?.detailedExpenses || periodData?.expensesByCategory || periodData?.detailed || periodData?.expenses || {};
  const historicalExpensesArray: any[] = Array.isArray(detailedCandidates)
    ? detailedCandidates
    : Object.values(detailedCandidates || {}).flat();

  console.log('ℹ️ Historical expenses count for', periodKey, ':', historicalExpensesArray.length);

  // Helper to compute spent for a category in historical view. Prefer precomputed totals if available.
  const getHistoricalSpentAmount = (categoryKey: string) => {
    // Check totalsByCategory or totals mapping
    const totalsByCategory = periodData?.totalsByCategory || periodData?.categoryTotals || periodData?.totals?.byCategory;
    if (totalsByCategory && typeof totalsByCategory === 'object') {
      const entry = totalsByCategory[categoryKey] || totalsByCategory[categoryKey?.toString()];
      if (entry && (typeof entry === 'number' || typeof entry?.spent === 'number' || typeof entry?.totalSpent === 'number')) {
        return typeof entry === 'number' ? entry : (entry.spent ?? entry.totalSpent ?? 0);
      }
    }

    // Fallback: sum amounts from historicalExpensesArray for the category
    try {
      return historicalExpensesArray
        .filter((e: any) => e && e.category === categoryKey)
        .reduce((sum: number, e: any) => sum + (e.amount || e.value || 0), 0);
    } catch (err) {
      return 0;
    }
  };

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

      <View style={{ flex: 1 }}>
        {/* The entire scrollable area is the BudgetList FlatList. Move summary, period header and section title into the list header. */}
        {(() => {
          const now = new Date();
          const currentYear = now.getFullYear();
          const currentMonthNum = now.getMonth() + 1;
          const expensesForList = viewMode === 'historical'
            ? historicalExpensesArray
            : Array.isArray(expenses)
              ? expenses.filter((e: any) => {
                  if (!e) return false;
                  const d = e.createdAt ? new Date(e.createdAt) : null;
                  if (!d || Number.isNaN(d.getTime())) return false;
                  return d.getFullYear() === currentYear && (d.getMonth() + 1) === currentMonthNum;
                })
              : [];

          const headerNode = (
            <>
              <BudgetSummary
                totalBudget={typeof displayTotalBudget === 'number' ? displayTotalBudget : 0}
                totalSpent={typeof displayTotalSpent === 'number' ? displayTotalSpent : 0}
              />

              {/* Period header */}
              {viewMode === 'historical' && (
                <View style={[styles.stickyPeriodHeader, { backgroundColor: theme.surface }]}> 
                  <View style={{ paddingHorizontal: 16, paddingVertical: 10 }}>
                    <Text style={[styles.stickyPeriodTitle, { color: theme.text }]}>
                      {selectedPeriod === 'yearly' ? `${selectedYear}` : `${monthNames[selectedMonth - 1]} ${selectedYear}`}
                    </Text>
                    <Text style={[styles.stickyPeriodSubtitle, { color: theme.textSecondary }]}>Tap a category to view transactions for this period</Text>
                  </View>
                </View>
              )}

              <View style={{ paddingHorizontal: 12 }}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  {viewMode === 'historical' ? 'Historical Category Budgets' : 'Category Budgets'}
                </Text>
              </View>
            </>
          );

          return (
            <BudgetList
              categories={categories}
              budgets={displayBudgetsData}
              categoryIcons={categoryIcons}
              categoryColors={categoryColors}
              getSpentAmount={viewMode === 'current' ? getMonthlySpentAmount : getHistoricalSpentAmount}
              getPersonalSpentAmount={getPersonalSpentAmount}
              getGroupSpentAmount={getGroupSpentAmount}
              getProgressPercentage={getProgressPercentage}
              getProgressColor={getProgressColor}
              onAddPress={() => setShowAddModal(true)}
              onCategoryPress={handleCategoryPress}
              expenses={expensesForList}
              refreshing={refreshing}
              onRefresh={handleRefresh}
              listHeaderComponent={headerNode}
            />
          );
        })()}
      </View>

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