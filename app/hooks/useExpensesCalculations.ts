import { useMemo } from 'react';

interface Expense {
  _id: string;
  amount: number;
  category: string;
  description: string;
  userId: string;
  groupId?: string;
  createdAt: string;
}

interface SplitBill {
  _id: string;
  totalAmount: number;
  participants: {
    userId: string;
    amount: number;
  }[];
  isSettled: boolean;
  createdAt: string;
}

export const useExpensesCalculations = (
  expenses: Expense[],
  splitBills: SplitBill[],
  selectedGroup: any,
  currentUser: any
) => {
  const filteredExpenses = useMemo(() => {
    if (!selectedGroup) {
      // Show personal expenses only
      return expenses.filter(expense => !expense.groupId && expense.userId === currentUser?._id);
    } else {
      // Show group expenses
      return expenses.filter(expense => expense.groupId === selectedGroup._id);
    }
  }, [expenses, selectedGroup, currentUser]);

  const totalExpensesAmount = useMemo(() => {
    return filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  }, [filteredExpenses]);

  const totalSplitBills = useMemo(() => {
    if (!selectedGroup) {
      return splitBills.filter(bill =>
        bill.participants.some(p => p.userId === currentUser?._id)
      ).length;
    } else {
      return splitBills.filter(bill => bill.participants.some(p => p.userId === currentUser?._id)).length;
    }
  }, [splitBills, selectedGroup, currentUser]);

  const settlementStats = useMemo(() => {
    const userBills = splitBills.filter(bill =>
      bill.participants.some(p => p.userId === currentUser?._id)
    );

    const settled = userBills.filter(bill => bill.isSettled).length;
    const pending = userBills.length - settled;

    return { settled, pending };
  }, [splitBills, currentUser]);

  return {
    filteredExpenses,
    totalExpensesAmount,
    totalSplitBills,
    settlementStats,
  };
};

export default useExpensesCalculations;