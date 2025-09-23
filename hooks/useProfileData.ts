import { useState } from 'react';
import { useFinanceStore } from '../lib/store/financeStore';

export const useProfileData = () => {
  const {
    currentUser,
    expenses,
    splitBills,
    groups,
    selectedGroup,
    selectGroup,
    createGroup,
    generateInviteLink,
    logout,
    isLoading
  } = useFinanceStore();

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const totalSplitBills = splitBills.length;

  return {
    currentUser,
    expenses,
    splitBills,
    groups,
    selectedGroup,
    selectGroup,
    createGroup,
    generateInviteLink,
    logout,
    isLoading,
    totalExpenses,
    totalSplitBills,
  };
};