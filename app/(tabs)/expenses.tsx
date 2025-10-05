import React from 'react';
import { StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ExpensesHeader from '@/app/components/ExpensesHeader';
import ExpenseForm from '@/app/components/ExpenseForm';
import ExpenseContent from '@/app/components/ExpenseContent';
import ErrorDisplay from '@/app/components/ErrorDisplay';
import LoadingIndicator from '@/app/components/LoadingIndicator';
import { FloatingActionButton } from '@/app/components/FloatingActionButton';
import { useExpensesLogic } from '@/hooks/useExpensesLogic';
import { useExpensesCalculations } from '@/hooks/useExpensesCalculations';
import { useTheme } from '../context/ThemeContext';
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
    settlementStats,
  } = useExpensesCalculations(expenses, splitBills, selectedGroup, currentUser);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        loadExpenses(),
        loadGroups(),
        getSplitBills(),
        loadBudgets()
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
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
        <ExpensesHeader
          activeTab={activeTab}
          onTabChange={setActiveTab}
          totalExpenses={totalExpensesAmount}
          totalSplitBills={totalSplitBills}
          settlementStats={settlementStats}
          onReload={handleManualReload}
        />

        <ErrorDisplay error={storeError} onRetry={handleRetry} />

        <LoadingIndicator loading={storeLoading} />

        <ExpenseContent
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
          onSplitBillTabChange={setSplitBillTab}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
});