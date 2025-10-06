import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BudgetHeader } from '../components/BudgetHeader';
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

const PeriodSelector = () => {
  const { theme } = useTheme();
  const {
    selectedPeriod,
    selectedYear,
    selectedMonth,
    setSelectedPeriod,
    setSelectedYear,
    setSelectedMonth,
    loadHistoricalBudgets
  } = useBudgetsStore();

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  const handlePeriodChange = (period: 'monthly' | 'yearly') => {
    setSelectedPeriod(period);
    if (period === 'yearly') {
      loadHistoricalBudgets({ period: 'yearly', year: selectedYear });
    } else {
      loadHistoricalBudgets({ period: 'monthly', year: selectedYear, month: selectedMonth });
    }
  };

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    if (selectedPeriod === 'yearly') {
      loadHistoricalBudgets({ period: 'yearly', year });
    } else {
      loadHistoricalBudgets({ period: 'monthly', year, month: selectedMonth });
    }
  };

  const handleMonthChange = (month: number) => {
    setSelectedMonth(month);
    setShowMonthPicker(false);
    if (selectedPeriod === 'monthly') {
      loadHistoricalBudgets({ period: 'monthly', year: selectedYear, month });
    }
  };

  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  return (
    <View style={[styles.periodSelector, { backgroundColor: theme.card }]}>
      <View style={styles.periodButtons}>
        <TouchableOpacity
          style={[
            styles.periodButton,
            selectedPeriod === 'monthly' && [styles.selectedPeriodButton, { backgroundColor: theme.primary }]
          ]}
          onPress={() => handlePeriodChange('monthly')}
        >
          <Text style={[
            styles.periodButtonText,
            selectedPeriod === 'monthly' && styles.selectedPeriodButtonText
          ]}>
            Monthly
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.periodButton,
            selectedPeriod === 'yearly' && [styles.selectedPeriodButton, { backgroundColor: theme.primary }]
          ]}
          onPress={() => handlePeriodChange('yearly')}
        >
          <Text style={[
            styles.periodButtonText,
            selectedPeriod === 'yearly' && styles.selectedPeriodButtonText
          ]}>
            Yearly
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.dateSelectors}>
        <TouchableOpacity
          style={[styles.dateButton, { borderColor: theme.border }]}
          onPress={() => handleYearChange(selectedYear - 1)}
        >
          <Text style={[styles.dateButtonText, { color: theme.text }]}>‹</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.dateDisplay, { borderColor: theme.border }]}
          onPress={selectedPeriod === 'monthly' ? () => setShowMonthPicker(!showMonthPicker) : undefined}
        >
          <Text style={[styles.dateText, { color: theme.text }]}>
            {selectedPeriod === 'monthly'
              ? `${monthNames[selectedMonth - 1]} ${selectedYear}`
              : selectedYear.toString()
            }
          </Text>
          {selectedPeriod === 'monthly' && (
            <Text style={[styles.dropdownIcon, { color: theme.text }]}>▼</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.dateButton, { borderColor: theme.border }]}
          onPress={() => handleYearChange(selectedYear + 1)}
        >
          <Text style={[styles.dateButtonText, { color: theme.text }]}>›</Text>
        </TouchableOpacity>
      </View>

      {showMonthPicker && selectedPeriod === 'monthly' && (
        <View style={[styles.monthPicker, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.monthGrid}>
            {monthNames.map((month, index) => (
              <TouchableOpacity
                key={month}
                style={[
                  styles.monthButton,
                  selectedMonth === index + 1 && [styles.selectedMonthButton, { backgroundColor: theme.primary }]
                ]}
                onPress={() => handleMonthChange(index + 1)}
              >
                <Text style={[
                  styles.monthButtonText,
                  selectedMonth === index + 1 && styles.selectedMonthButtonText
                ]}>
                  {month}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

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
    totalBudget,
    totalSpent,
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

  // Load data when component mounts
  useEffect(() => {
    loadData();
    loadBudgetTrends();
  }, [loadData]);

  // Load historical budgets when period changes
  useEffect(() => {
    if (viewMode === 'historical') {
      const { selectedYear, selectedMonth } = useBudgetsStore.getState();
      if (selectedPeriod === 'yearly') {
        loadHistoricalBudgets({ period: 'yearly', year: selectedYear });
      } else {
        loadHistoricalBudgets({ period: 'monthly', year: selectedYear, month: selectedMonth });
      }
    }
  }, [selectedPeriod, viewMode]);

  const displayBudgets = viewMode === 'historical' ? historicalBudgets : budgets;
  
  // Get budgets for display based on view mode
  const getDisplayBudgets = () => {
    if (viewMode === 'historical') {
      // For historical view, get budgets for the selected period
      let periodKey: string;
      if (selectedPeriod === 'yearly') {
        periodKey = selectedYear.toString();
      } else {
        periodKey = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}`;
      }

      const periodData = historicalBudgets[periodKey];
      return periodData?.budgets || {};
    }
    return budgets;
  };

  // Calculate totals for display
  const getDisplayTotals = () => {
    if (viewMode === 'historical') {
      // For historical view, get totals for the selected period
      let periodKey: string;
      if (selectedPeriod === 'yearly') {
        periodKey = selectedYear.toString();
      } else {
        periodKey = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}`;
      }

      const periodData = historicalBudgets[periodKey];
      return {
        totalBudget: periodData?.totals?.totalAmount || 0,
        totalSpent: periodData?.totals?.totalSpent || 0
      };
    }
    return {
      totalBudget,
      totalSpent
    };
  };

  const { totalBudget: displayTotalBudget, totalSpent: displayTotalSpent } = getDisplayTotals();
  const displayBudgetsData = getDisplayBudgets();

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
      <BudgetHeader />

      <View style={styles.headerActions}>
        <TouchableOpacity
          style={[styles.analyticsButton, { backgroundColor: theme.primary }]}
          onPress={() => setShowAnalytics(true)}
        >
          <Text style={styles.analyticsButtonText}>Analytics</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.viewModeSelector}>
        <TouchableOpacity
          style={[
            styles.viewModeButton,
            viewMode === 'current' && [styles.selectedViewModeButton, { backgroundColor: theme.primary }]
          ]}
          onPress={() => setViewMode('current')}
        >
          <Text style={[
            styles.viewModeButtonText,
            viewMode === 'current' && styles.selectedViewModeButtonText
          ]}>
            Current
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.viewModeButton,
            viewMode === 'historical' && [styles.selectedViewModeButton, { backgroundColor: theme.primary }]
          ]}
          onPress={() => setViewMode('historical')}
        >
          <Text style={[
            styles.viewModeButtonText,
            viewMode === 'historical' && styles.selectedViewModeButtonText
          ]}>
            Historical
          </Text>
        </TouchableOpacity>
      </View>

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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  viewModeSelector: {
    flexDirection: 'row',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  viewModeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedViewModeButton: {
    backgroundColor: '#007bff',
  },
  viewModeButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  selectedViewModeButtonText: {
    color: '#fff',
  },
  categoriesSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  periodSelector: {
    padding: 16,
    borderRadius: 8,
    margin: 16,
  },
  periodButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  periodButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedPeriodButton: {
    backgroundColor: '#007bff',
  },
  periodButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  selectedPeriodButtonText: {
    color: '#fff',
  },
  dateSelectors: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dateButton: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  dateDisplay: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  dateText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  dropdownIcon: {
    marginLeft: 8,
    fontSize: 12,
  },
  monthPicker: {
    marginTop: 8,
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  monthButton: {
    width: '30%',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  selectedMonthButton: {
    backgroundColor: '#007bff',
  },
  monthButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  selectedMonthButtonText: {
    color: '#fff',
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  analyticsButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  analyticsButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  analyticsModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
});