import { useMemo } from 'react';

interface Participant {
  userId: string;
  amount: number;
  isPaid: boolean;
}

interface SplitBill {
  _id: string;
  participants: Participant[];
  totalAmount: number;
}

export const useExpensesCalculations = (
  expenses: any[],
  splitBills: SplitBill[],
  selectedGroup: any,
  currentUser: any
) => {
  // Filter expenses based on selected group
  const filteredExpenses = useMemo(() => {
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
  const totalExpensesAmount = useMemo(() => {
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
  const settlementStats = useMemo(() => ({
    awaiting: splitBills
      .filter(bill => bill.participants.some((p: Participant) => p.userId === currentUser?._id && !p.isPaid))
      .length,
    totalAwaiting: splitBills
      .filter(bill => bill.participants.some((p: Participant) => p.userId === currentUser?._id && !p.isPaid))
      .reduce((total, bill) => {
        const userParticipant = bill.participants.find((p: Participant) => p.userId === currentUser?._id);
        return total + (userParticipant?.amount || 0);
      }, 0),
    settled: splitBills
      .filter(bill => bill.participants.every((p: Participant) => p.isPaid))
      .length,
    totalSettled: splitBills
      .filter(bill => bill.participants.every((p: Participant) => p.isPaid))
      .reduce((total, bill) => total + bill.totalAmount, 0)
  }), [splitBills, currentUser?._id]);

  return {
    filteredExpenses,
    totalExpensesAmount,
    totalExpenses,
    totalSplitBills,
    settlementStats,
  };
};