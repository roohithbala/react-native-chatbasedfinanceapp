import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ExpensesHeader from '@/app/components/ExpensesHeader';
import ExpenseForm from '@/app/components/ExpenseForm';
import ExpenseContent from '@/app/components/ExpenseContent';
import ErrorDisplay from '@/app/components/ErrorDisplay';
import LoadingIndicator from '@/app/components/LoadingIndicator';
import { FloatingActionButton } from '@/app/components/FloatingActionButton';
import { useFinanceStore } from '@/lib/store/financeStore';
import { API_BASE_URL } from '@/lib/services/api';

export default function ExpensesScreen() {
  const [activeTab, setActiveTab] = useState<'expenses' | 'splitBills'>('expenses');
  const [viewMode, setViewMode] = useState<'list' | 'category'>('category');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [splitBillTab, setSplitBillTab] = useState<'awaiting' | 'settled'>('awaiting');
  const expensesLoadedRef = useRef(false);
  const splitBillsLoadedRef = useRef(false);

  const {
    currentUser,
    expenses,
    splitBills,
    selectedGroup,
    loadExpenses,
    getGroupSplitBills,
    addExpense,
    updateExpense,
    deleteExpense,
    markSplitBillAsPaid,
    error: storeError,
    isLoading: storeLoading,
    clearError
  } = useFinanceStore();

  // Reset refs when user changes
  React.useEffect(() => {
    if (currentUser) {
      expensesLoadedRef.current = false;
      splitBillsLoadedRef.current = false;
    }
  }, [currentUser?._id]);

  // Initial load when component mounts
  React.useEffect(() => {
    // If we have a user but no expenses and haven't loaded yet, trigger load
    if (currentUser && expenses.length === 0 && !expensesLoadedRef.current) {
      expensesLoadedRef.current = true;
      loadExpenses().catch((error: any) => {
        console.error('Initial load failed:', error);
        expensesLoadedRef.current = false;
      });
    }
  }, []); // Only run on mount

  // Reset split bills ref when group changes
  React.useEffect(() => {
    if (selectedGroup) {
      splitBillsLoadedRef.current = false;
    }
  }, [selectedGroup?._id]);

  // Load data on mount and when user changes
  useEffect(() => {
    // Load expenses if we have a user and either haven't loaded yet OR expenses are empty
    if (currentUser && (!expensesLoadedRef.current || expenses.length === 0)) {
      expensesLoadedRef.current = true;
      loadExpenses().catch((error: any) => {
        console.error('Failed to load expenses:', error);
        expensesLoadedRef.current = false; // Reset on error so we can retry
      });
    }
  }, [currentUser?._id, expenses.length]); // Include expenses.length to trigger when expenses become empty

  // Load split bills when group changes
  useEffect(() => {
    // Check if we already have split bills for this group
    const hasSplitBillsForGroup = splitBills.some(bill => bill.groupId === selectedGroup?._id);

    if (selectedGroup?._id && currentUser && !splitBillsLoadedRef.current && !hasSplitBillsForGroup) {
      splitBillsLoadedRef.current = true;
      getGroupSplitBills(selectedGroup._id).catch((error: any) => {
        console.error('Failed to load split bills:', error);
        splitBillsLoadedRef.current = false; // Reset on error so we can retry
      });
    }
  }, [selectedGroup?._id, currentUser?._id]); // Only depend on group ID and user ID

  const handleRetry = () => {
    clearError();
    expensesLoadedRef.current = false;
    splitBillsLoadedRef.current = false;
    loadExpenses().catch(console.error);
    if (selectedGroup?._id) {
      getGroupSplitBills(selectedGroup._id).catch(console.error);
    }
  };

  // Manual reload function for debugging
  const handleManualReload = () => {
    Alert.alert(
      'Debug Options',
      'Choose an action:',
      [
        { text: 'Reload Data', onPress: () => {
          // Reset refs and force reload
          expensesLoadedRef.current = false;
          splitBillsLoadedRef.current = false;

          // Load expenses
          loadExpenses().catch((error: any) => {
            console.error('Manual reload failed:', error);
            expensesLoadedRef.current = false;
          });

          // Load split bills if group selected
          if (selectedGroup?._id) {
            getGroupSplitBills(selectedGroup._id).catch((error: any) => {
              console.error('Manual split bills reload failed:', error);
              splitBillsLoadedRef.current = false;
            });
          }
        }},
        { text: 'Test API', onPress: testExpensesAPI },
        { text: 'Force Load Expenses', onPress: async () => {
          try {
            expensesLoadedRef.current = false;
            await loadExpenses();
            Alert.alert('Success', 'Expenses loaded successfully');
          } catch (error: any) {
            console.error('Force load failed:', error);
            Alert.alert('Error', `Failed to load expenses: ${error.message}`);
          }
        }},
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  // Test expenses API connectivity
  const testExpensesAPI = async () => {
    try {
      console.log('Testing expenses API connectivity...');
      const response = await fetch(`${API_BASE_URL}/expenses`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await AsyncStorage.getItem('authToken')}`,
        },
      });
      
      console.log('Expenses API test response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Expenses API test data:', data);
        Alert.alert('API Reachable', `Status: ${response.status}\nData keys: ${Object.keys(data).join(', ')}`);
      } else {
        const errorText = await response.text();
        console.error('Expenses API test error:', errorText);
        Alert.alert('API Error', `Status: ${response.status}\n${errorText}`);
      }
    } catch (error: any) {
      console.error('Expenses API test failed:', error);
      Alert.alert('API Test Failed', error.message);
    }
  };

  const handleAddExpense = async (expenseData: any) => {
    try {
      console.log('Adding expense:', expenseData);
      await addExpense(expenseData);
      setShowAddModal(false);
      Alert.alert('Success', 'Expense added successfully!');
    } catch (error: any) {
      console.error('Error adding expense:', error);
      Alert.alert('Error', error.message || 'Failed to add expense');
    }
  };

  const handleEditExpense = async (expenseData: any) => {
    if (!editingExpense) return;

    try {
      console.log('Updating expense:', editingExpense._id, expenseData);
      await updateExpense(editingExpense._id, expenseData);
      setShowEditModal(false);
      setEditingExpense(null);
      Alert.alert('Success', 'Expense updated successfully!');
    } catch (error: any) {
      console.error('Error updating expense:', error);
      Alert.alert('Error', error.message || 'Failed to update expense');
    }
  };

  const handleDeleteExpense = async (expense: any) => {
    try {
      console.log('Deleting expense:', expense._id);
      await deleteExpense(expense._id);
      Alert.alert('Success', 'Expense deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting expense:', error);
      Alert.alert('Error', error.message || 'Failed to delete expense');
    }
  };

  const handleMarkAsPaid = async (splitBillId: string) => {
    try {
      console.log('Marking split bill as paid:', splitBillId);
      await markSplitBillAsPaid(splitBillId);
      Alert.alert('Success', 'Payment marked as paid!');
    } catch (error: any) {
      console.error('Error marking as paid:', error);
      Alert.alert('Error', error.message || 'Failed to mark as paid');
    }
  };

  // Filter expenses based on selected group
  const filteredExpenses = React.useMemo(() => {
    let filtered = expenses;

    if (selectedGroup) {
      // When a group is selected, show both personal expenses (no groupId) and group expenses
      filtered = expenses.filter(expense =>
        !expense.groupId || expense.groupId === selectedGroup._id
      );
    }

    return filtered;
  }, [expenses, selectedGroup]);

  // Calculate totals
  const totalExpensesAmount = React.useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    return filteredExpenses
      .filter(expense => {
        const expenseDate = new Date(expense.createdAt);
        return expenseDate.getMonth() === currentMonth &&
               expenseDate.getFullYear() === currentYear;
      })
      .reduce((total, expense) => total + (expense.amount || 0), 0);
  }, [filteredExpenses]);

  const totalExpenses = filteredExpenses.length;
  const totalSplitBills = splitBills.length;

  // Calculate settlement stats
  const settlementStats = {
    awaiting: splitBills
      .filter(bill => bill.participants.some(p => p.userId === currentUser?._id && !p.isPaid))
      .length,
    totalAwaiting: splitBills
      .filter(bill => bill.participants.some(p => p.userId === currentUser?._id && !p.isPaid))
      .reduce((total, bill) => {
        const userParticipant = bill.participants.find(p => p.userId === currentUser?._id);
        return total + (userParticipant?.amount || 0);
      }, 0),
    settled: splitBills
      .filter(bill => bill.participants.every(p => p.isPaid))
      .length,
    totalSettled: splitBills
      .filter(bill => bill.participants.every(p => p.isPaid))
      .reduce((total, bill) => total + bill.totalAmount, 0)
  };

  return (
    <SafeAreaView style={styles.container}>
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
        onEditExpense={handleEditExpense}
        onDeleteExpense={handleDeleteExpense}
        selectedGroup={selectedGroup}
        splitBills={splitBills}
        currentUser={currentUser}
        splitBillTab={splitBillTab}
        onSplitBillTabChange={setSplitBillTab}
        onMarkAsPaid={handleMarkAsPaid}
      />

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
    backgroundColor: '#F8FAFC',
  },
});