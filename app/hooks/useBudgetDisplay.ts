import { useMemo } from 'react';

type UseBudgetDisplayArgs = {
  viewMode: 'current' | 'historical';
  budgets: any;
  historicalBudgets: any;
  selectedPeriod: string;
  selectedYear: number;
  selectedMonth: number;
};

export default function useBudgetDisplay({ viewMode, budgets, historicalBudgets, selectedPeriod, selectedYear, selectedMonth }: UseBudgetDisplayArgs) {
  const displayBudgetsData = useMemo(() => {
    if (viewMode === 'historical') {
      let periodKey: string;
      if (selectedPeriod === 'yearly') {
        periodKey = selectedYear.toString();
      } else {
        periodKey = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}`;
      }
      console.log('📊 Historical budget display:', {
        periodKey,
        hasHistoricalData: !!historicalBudgets,
        availableKeys: historicalBudgets ? Object.keys(historicalBudgets) : [],
        periodData: historicalBudgets[periodKey]
      });
      const periodData = historicalBudgets[periodKey];
      return periodData?.budgets || {};
    }
    console.log('📊 Current budget display:', {
      hasBudgets: !!budgets,
      budgetType: typeof budgets,
      budgetKeys: budgets ? Object.keys(budgets) : []
    });
    return budgets;
  }, [viewMode, budgets, historicalBudgets, selectedPeriod, selectedYear, selectedMonth]);

  const displayTotals = useMemo(() => {
    if (viewMode === 'historical') {
      let periodKey: string;
      if (selectedPeriod === 'yearly') {
        periodKey = selectedYear.toString();
      } else {
        periodKey = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}`;
      }
      const periodData = historicalBudgets[periodKey];
      const totals = {
        totalBudget: periodData?.totals?.totalAmount || 0,
        totalSpent: periodData?.totals?.totalSpent || 0,
      };
      console.log('📊 Historical totals:', { periodKey, totals, periodData: periodData?.totals });
      return totals;
    }
    
    // For current budgets, calculate totals from budgets object
    let totalBudget = 0;
    let totalSpent = 0;
    
    if (budgets && typeof budgets === 'object') {
      // If budgets is a simple object with category: amount structure
      Object.values(budgets).forEach((value: any) => {
        if (typeof value === 'number') {
          totalBudget += value;
        }
      });
    }
    
    const totals = { totalBudget, totalSpent };
    console.log('📊 Current totals:', totals);
    return totals;
  }, [viewMode, budgets, historicalBudgets, selectedPeriod, selectedYear, selectedMonth]);

  return { displayBudgetsData, displayTotals };
}
