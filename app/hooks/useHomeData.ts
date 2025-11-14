import { useMemo } from 'react';
import { useFinanceStore } from '../../lib/store/financeStore';

export function useHomeData() {
  const { currentUser, expenses, splitBills, budgets } = useFinanceStore();

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

  const lastMonthExpenses = useMemo(() => {
    if (!expenses || !Array.isArray(expenses)) return 0;
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const lastMonthNum = lastMonth.getMonth();
    const lastMonthYear = lastMonth.getFullYear();
    return expenses
      .filter((expense: any) => {
        if (!expense || !expense.createdAt || !expense.amount) return false;
        const expenseDate = new Date(expense.createdAt);
        return (
          expenseDate.getMonth() === lastMonthNum && expenseDate.getFullYear() === lastMonthYear
        );
      })
      .reduce((total: number, expense: any) => total + (expense.amount || 0), 0);
  }, [expenses]);

  const budgetRemaining = useMemo(() => {
    if (!budgets || typeof budgets !== 'object') return 0;
    
    // Calculate total budget across all categories
    const totalBudget = Object.values(budgets).reduce((sum: number, amount: any) => {
      return sum + (typeof amount === 'number' ? amount : 0);
    }, 0);
    
    // Return remaining budget (total budget - expenses this month)
    return Math.max(0, totalBudget - totalExpensesThisMonth);
  }, [budgets, totalExpensesThisMonth]);

  const netPosition = useMemo(() => {
    // Calculate money owed to user vs money user owes
    let owedToUser = 0;
    let userOwes = 0;
    
    if (currentUser && splitBills && Array.isArray(splitBills)) {
      splitBills.forEach((bill: any) => {
        if (bill.isSettled) return;
        
        const participants = bill.participants || [];
        const totalAmount = bill.totalAmount || 0;
        const numParticipants = participants.length;
        const equalShare = numParticipants > 0 ? totalAmount / numParticipants : 0;
        
        participants.forEach((p: any) => {
          const userId = typeof p.userId === 'string' ? p.userId : (p.userId as any)?._id;
          
          if (userId === currentUser._id) {
            // User owes this amount
            if (!p.isPaid) {
              userOwes += p.amount || equalShare;
            }
          } else {
            // Someone else owes user money
            if (!p.isPaid) {
              owedToUser += equalShare - (p.amount || equalShare);
            }
          }
        });
      });
    }
    
    // Net position = money owed to user - money user owes
    return owedToUser - userOwes;
  }, [splitBills, currentUser]);

  return {
    recentExpenses,
    pendingSplitBills,
    totalOwed,
    totalExpensesThisMonth,
    budgetRemaining,
    netPosition,
    lastMonthExpenses,
  };
}

export default useHomeData;
