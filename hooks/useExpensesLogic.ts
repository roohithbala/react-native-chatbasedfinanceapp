import { useState, useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFinanceStore } from '@/lib/store/financeStore';
import { API_BASE_URL } from '@/lib/services/api';

export const useExpensesLogic = () => {
  const [activeTab, setActiveTab] = useState<'expenses' | 'splitBills'>('expenses');
  const [viewMode, setViewMode] = useState<'list' | 'category' | 'participants'>('category');
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
  useEffect(() => {
    if (currentUser) {
      expensesLoadedRef.current = false;
      splitBillsLoadedRef.current = false;
    }
  }, [currentUser?._id]);

  // Initial load when component mounts
  useEffect(() => {
    if (currentUser && expenses.length === 0 && !expensesLoadedRef.current) {
      expensesLoadedRef.current = true;
      loadExpenses().catch((error: any) => {
        console.error('Initial load failed:', error);
        expensesLoadedRef.current = false;
      });
    }
  }, []); // Only run on mount

  // Reset split bills ref when group changes
  useEffect(() => {
    if (selectedGroup) {
      splitBillsLoadedRef.current = false;
    }
  }, [selectedGroup?._id]);

  // Load data on mount and when user changes
  useEffect(() => {
    if (currentUser && (!expensesLoadedRef.current || expenses.length === 0)) {
      expensesLoadedRef.current = true;
      loadExpenses().catch((error: any) => {
        console.error('Failed to load expenses:', error);
        expensesLoadedRef.current = false;
      });
    }
  }, [currentUser?._id, expenses.length]);

  // Load split bills when group changes
  useEffect(() => {
    const hasSplitBillsForGroup = splitBills.some(bill => bill.groupId === selectedGroup?._id);

    if (selectedGroup?._id && currentUser && !splitBillsLoadedRef.current && !hasSplitBillsForGroup) {
      splitBillsLoadedRef.current = true;
      getGroupSplitBills(selectedGroup._id).catch((error: any) => {
        console.error('Failed to load split bills:', error);
        splitBillsLoadedRef.current = false;
      });
    }
  }, [selectedGroup?._id, currentUser?._id]);

  const handleRetry = () => {
    clearError();
    expensesLoadedRef.current = false;
    splitBillsLoadedRef.current = false;
    loadExpenses().catch(console.error);
    if (selectedGroup?._id) {
      getGroupSplitBills(selectedGroup._id).catch(console.error);
    }
  };

  const handleManualReload = () => {
    Alert.alert(
      'Debug Options',
      'Choose an action:',
      [
        { text: 'Reload Data', onPress: () => {
          expensesLoadedRef.current = false;
          splitBillsLoadedRef.current = false;
          loadExpenses().catch((error: any) => {
            console.error('Manual reload failed:', error);
            expensesLoadedRef.current = false;
          });
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

  return {
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
    clearError,
  };
};