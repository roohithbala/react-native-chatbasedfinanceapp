import { useMemo } from 'react';
import { useFinanceStore } from '../../lib/store/financeStore';

export function useHomeData() {
  const { currentUser, expenses, splitBills } = useFinanceStore();

  const recentExpenses = useMemo(() => {
    return expenses
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3);
  }, [expenses]);

  const pendingSplitBills = useMemo(() => {
    return (
      splitBills
        .filter((bill: any) =>
          bill.participants.some((p: any) => {
            const userId = typeof p.userId === 'string' ? p.userId : (p.userId as any)?._id;
            return userId === currentUser?._id && !p.isPaid;
          })
        )
        .slice(0, 3)
    );
  }, [splitBills, currentUser]);

  const totalOwed = useMemo(() => {
    if (!currentUser || !splitBills || !Array.isArray(splitBills)) return 0;
    
    return splitBills
      .filter((bill: any) => {
        // Skip settled bills
        if (bill.isSettled) return false;
        
        const participants = bill.participants || [];
        
        // Find current user's participant entry
        const currentUserParticipant = participants.find((p: any) => {
          const userId = typeof p.userId === 'string' ? p.userId : (p.userId as any)?._id;
          return userId === currentUser._id;
        });
        
        // User owes money if they are a participant and haven't paid
        return currentUserParticipant && !currentUserParticipant.isPaid;
      })
      .reduce((total: number, bill: any) => {
        const userParticipant = bill.participants.find((p: any) => {
          const userId = typeof p.userId === 'string' ? p.userId : (p.userId as any)?._id;
          return userId === currentUser._id;
        });
        return total + (userParticipant?.amount || 0);
      }, 0);
  }, [splitBills, currentUser]);

  const totalExpensesThisMonth = useMemo(() => {
    if (!expenses || !Array.isArray(expenses)) return 0;
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    return expenses
      .filter((expense: any) => {
        if (!expense || !expense.createdAt || !expense.amount) return false;
        const expenseDate = new Date(expense.createdAt);
        return (
          expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear
        );
      })
      .reduce((total: number, expense: any) => total + (expense.amount || 0), 0);
  }, [expenses]);

  return {
    recentExpenses,
    pendingSplitBills,
    totalOwed,
    totalExpensesThisMonth,
  };
}

export default useHomeData;
