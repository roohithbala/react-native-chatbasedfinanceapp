import { useState } from 'react';
import { Alert } from 'react-native';
import { useFinanceStore, Expense } from '@/lib/store/financeStore';

export function useExpenseActions() {
  const [loading, setLoading] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const {
    addExpense,
    updateExpense,
    deleteExpense,
    currentUser,
    selectedGroup,
  } = useFinanceStore();

  const handleAddExpense = async (expenseData: any) => {
    if (!currentUser) {
      Alert.alert('Error', 'Please log in to add expenses');
      return;
    }

    try {
      setLoading(true);

      const newExpense = {
        ...expenseData,
        userId: currentUser._id,
        groupId: selectedGroup?._id,
      };

      await addExpense(newExpense);
      setShowAddModal(false);
      Alert.alert('Success', 'Expense added successfully! 🎉');
    } catch (error: any) {
      console.error('Add expense error:', error);
      Alert.alert('Error', error.message || 'Failed to add expense. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setShowEditModal(true);
  };

  const handleUpdateExpense = async (expenseData: any) => {
    if (!editingExpense) return;

    try {
      setLoading(true);

      const updatedExpense = {
        ...editingExpense,
        ...expenseData,
      };

      await updateExpense(editingExpense._id, updatedExpense);

      setEditingExpense(null);
      setShowEditModal(false);
      Alert.alert('Success', 'Expense updated successfully! ✅');
    } catch (error: any) {
      console.error('Update expense error:', error);
      Alert.alert('Error', error.message || 'Failed to update expense. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExpense = (expense: Expense) => {
    Alert.alert(
      'Delete Expense',
      `Are you sure you want to delete "${expense.description}"?\n\nAmount: ₹${(expense.amount || 0).toFixed(2)}\nCategory: ${expense.category}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await deleteExpense(expense._id);
              Alert.alert('Success', 'Expense deleted successfully! 🗑️');
            } catch (error: any) {
              console.error('Delete expense error:', error);
              Alert.alert('Error', error.message || 'Failed to delete expense. Please try again.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return {
    loading,
    editingExpense,
    showAddModal,
    showEditModal,
    setShowAddModal,
    setShowEditModal,
    handleAddExpense,
    handleEditExpense,
    handleUpdateExpense,
    handleDeleteExpense,
  };
}