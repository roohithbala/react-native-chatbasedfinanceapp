import { useState } from 'react';
import { useFinanceStore } from '@/lib/store/financeStore';
import { Alert } from 'react-native';

export const useBudgetActions = () => {
  const { currentUser, setBudget } = useFinanceStore();

  const [showAddModal, setShowAddModal] = useState(false);
  const [category, setCategory] = useState('');
  const [limit, setLimit] = useState('');

  const handleSetBudget = async () => {
    if (!currentUser) {
      Alert.alert('Error', 'You must be logged in to set budgets');
      return;
    }

    if (!category.trim()) {
      Alert.alert('Error', 'Please select a category');
      return;
    }

    const budgetAmount = parseFloat(limit);
    if (isNaN(budgetAmount) || budgetAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid budget amount');
      return;
    }

    try {
      await setBudget(category.trim(), budgetAmount);

      setShowAddModal(false);
      setCategory('');
      setLimit('');
      Alert.alert('Success', 'Budget set successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to set budget');
    }
  };

  const handleRetry = () => {
    // This will be handled by the parent component
    console.log('Retry budget actions');
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

export default useBudgetActions;