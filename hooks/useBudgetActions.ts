import { useState } from 'react';
import { Alert } from 'react-native';
import { useFinanceStore } from '../lib/store/financeStore';

export const useBudgetActions = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [category, setCategory] = useState('Food');
  const [limit, setLimit] = useState('');

  const { setBudget, loadExpenses, loadBudgets } = useFinanceStore();

  const handleSetBudget = async () => {
    if (!limit.trim()) {
      Alert.alert('Error', 'Please enter a budget limit');
      return;
    }

    const budgetLimit = parseFloat(limit);
    if (isNaN(budgetLimit) || budgetLimit <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    try {
      // Set user-level budget
      await setBudget(category, budgetLimit);
      setLimit('');
      setShowAddModal(false);
      Alert.alert('Success', `Budget set for ${category}!`);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to set budget');
    }
  };

  const handleRetry = () => {
    loadExpenses().catch(console.error);
    loadBudgets().catch(console.error);
  };

  return {
    showAddModal,
    setShowAddModal,
    category,
    setCategory,
    limit,
    setLimit,
    handleSetBudget,
    handleRetry,
  };
};