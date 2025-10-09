import React from 'react';
import { ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ExpenseForm from '@/app/components/ExpenseForm';
import { FloatingActionButton } from '@/app/components/FloatingActionButton';
import ExpensesHeaderWrapper from '../components/ExpensesHeaderWrapper';
import ExpensesContentWrapper from '../components/ExpensesContentWrapper';
import { useExpensesLogic } from '@/hooks/useExpensesLogic';
import { useExpensesCalculations } from '@/hooks/useExpensesCalculations';
import { useTheme } from '../context/ThemeContext';
import styles from '@/lib/styles/expensesStyles';
import { useFinanceStore } from '@/lib/store/financeStore';

export default function ExpensesScreen() {
  const { theme } = useTheme();
  const [refreshing, setRefreshing] = React.useState(false);
  const { 
    loadExpenses,
    loadGroups,
    getSplitBills,
    loadBudgets
  } = useFinanceStore();
  const {
    // State
    activeTab,
    setActiveTab,
    viewMode,
    setViewMode,
    showAddModal,
    setShowAddModal,
    showEditModal,
    setShowEditModal,
    editingExpense,
    setEditingExpense,
    splitBillTab,
    setSplitBillTab,

    // Data
    currentUser,
    expenses,
    splitBills,
    selectedGroup,
    storeError,
    storeLoading,

    // Handlers
    handleRetry,
    handleManualReload,
    handleAddExpense,
    handleEditExpense,
    handleDeleteExpense,
    handleMarkAsPaid,
  } = useExpensesLogic();

  const {
    filteredExpenses,
    totalExpensesAmount,
    totalSplitBills,
    totalSplitBillsAmount,
    settlementStats,
  } = useExpensesCalculations(expenses, splitBills, selectedGroup, currentUser);

  // local refresh that uses the same store loaders
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        loadExpenses(),
        loadGroups(),
        getSplitBills(),
        loadBudgets(),
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // type-safe wrapper for split bill tab setter
  const handleSplitBillTabChange = (t: string) => {
    setSplitBillTab(t as any);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <ExpensesHeaderWrapper
          activeTab={activeTab}
          onTabChange={setActiveTab}
          totalExpenses={totalExpensesAmount}
          totalSplitBills={totalSplitBillsAmount}
          settlementStats={settlementStats}
          onReload={handleManualReload}
        />

        <ExpensesContentWrapper
          storeError={storeError}
          storeLoading={storeLoading}
          onRetry={handleRetry}
          activeTab={activeTab}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          filteredExpenses={filteredExpenses}
          onEditExpense={setEditingExpense}
          onDeleteExpense={handleDeleteExpense}
          selectedGroup={selectedGroup}
          splitBills={splitBills}
          currentUser={currentUser}
          splitBillTab={splitBillTab}
          onSplitBillTabChange={handleSplitBillTabChange}
          onMarkAsPaid={handleMarkAsPaid}
        />
      </ScrollView>

  <FloatingActionButton onPress={() => setShowAddModal(true)} />

      <ExpenseForm
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleAddExpense}
        loading={false}
      />

      <ExpenseForm
        visible={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingExpense(null);
        }}
        onSave={handleEditExpense}
        loading={false}
        initialData={editingExpense}
        isEdit={true}
      />
    </SafeAreaView>
  );
}

// styles moved to app/(tabs)/styles/expensesStyles.ts