import { useEffect, useMemo } from 'react';
import { useFinanceStore, Expense } from '@/lib/store/financeStore';

export function useExpenseData() {
  const {
    expenses: rawExpenses,
    currentUser,
    selectedGroup,
    loadExpenses,
    getGroupSplitBills,
  } = useFinanceStore();

  // Ensure expenses are always arrays
  const expenses = Array.isArray(rawExpenses) ? rawExpenses : [];

  // Load data when component mounts or selected group changes
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('Loading expenses data in expenses component...');
        if (currentUser) {
          await loadExpenses();
          console.log('Expenses data loaded successfully');

          // Try to load group split bills, but don't fail if it doesn't work
          if (selectedGroup?._id) {
            try {
              await getGroupSplitBills(selectedGroup._id);
              console.log('Group split bills loaded successfully');
            } catch (splitBillError) {
              console.warn('Failed to load group split bills, but continuing with expenses:', splitBillError);
              // Don't throw - we still want to show expenses even if split bills fail
            }
          }
        }
      } catch (error) {
        console.error('Error loading expenses data in component:', error);
        // Error is already handled in the store and displayed in the UI
      }
    };

    loadData();
  }, [currentUser, selectedGroup?._id, loadExpenses, getGroupSplitBills]);

  // Filter expenses by selected group
  const filteredExpenses = useMemo(() => {
    if (!selectedGroup) return expenses;
    return expenses.filter((expense: Expense) => expense.groupId === selectedGroup._id);
  }, [expenses, selectedGroup]);

  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  return {
    expenses,
    filteredExpenses,
    totalExpenses,
  };
}