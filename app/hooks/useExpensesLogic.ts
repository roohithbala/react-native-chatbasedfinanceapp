import { useState, useEffect } from 'react';
import { useFinanceStore } from '@/lib/store/financeStore';
import { Alert } from 'react-native';

export const useExpensesLogic = () => {
  const {
    currentUser,
    expenses,
    splitBills,
    groups,
    selectedGroup,
    selectGroup,
    addExpense,
    updateExpense,
    deleteExpense,
    markSplitBillAsPaid,
    isLoading: storeLoading,
    error: storeError,
    clearError,
  } = useFinanceStore();

  // State
  const [activeTab, setActiveTab] = useState<'expenses' | 'splitBills'>('expenses');
  const [viewMode, setViewMode] = useState<'list' | 'category' | 'participants'>('list');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [splitBillTab, setSplitBillTab] = useState<'awaiting' | 'settled'>('awaiting');

  // Handlers
  const handleRetry = () => {
    clearError();
    // Add retry logic here if needed
  };

  const handleManualReload = () => {
    // Add manual reload logic here if needed
    console.log('Manual reload triggered');
  };

  const handleAddExpense = async (expenseData: any) => {
    try {
      await addExpense(expenseData);
      setShowAddModal(false);
      Alert.alert('Success', 'Expense added successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add expense');
    }
  };

  const handleEditExpense = async (expenseData: any) => {
    try {
      if (editingExpense) {
        await updateExpense(editingExpense._id, expenseData);
        setShowEditModal(false);
        setEditingExpense(null);
        Alert.alert('Success', 'Expense updated successfully!');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update expense');
    }
  };

  const handleDeleteExpense = async (expense: any) => {
    Alert.alert(
      'Delete Expense',
      'Are you sure you want to delete this expense?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteExpense(expense._id);
              Alert.alert('Success', 'Expense deleted successfully!');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete expense');
            }
          },
        },
      ]
    );
  };

  const handleMarkAsPaid = async (billId: string) => {
    try {
      await markSplitBillAsPaid(billId);
      Alert.alert('Success', 'Payment marked successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to mark payment');
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
  };
};

export default useExpensesLogic;