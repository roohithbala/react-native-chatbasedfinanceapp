import { useMemo } from 'react';

type UseBudgetDisplayArgs = {
  viewMode: 'current' | 'historical';
  budgets: any;
  expenses: any[];
  historicalBudgets: any;
  selectedPeriod: string;
  selectedYear: number;
  selectedMonth: number;
};

export default function useBudgetDisplay({ viewMode, budgets, expenses, historicalBudgets, selectedPeriod, selectedYear, selectedMonth }: UseBudgetDisplayArgs) {
  const displayBudgetsData = useMemo(() => {
    if (viewMode === 'historical') {
      const availableKeys = historicalBudgets ? Object.keys(historicalBudgets) : [];
      // Yearly: aggregate budgets across months for the selected year
      if (selectedPeriod === 'yearly') {
        const yearKey = String(selectedYear);
        const monthKeys = (availableKeys || []).filter(k => k === yearKey || k.startsWith(`${yearKey}-`));
        const aggregated: Record<string, number> = {};
        monthKeys.forEach((k) => {
          const pd = historicalBudgets[k] || {};
          const b = pd?.budgets || {};
          Object.keys(b).forEach((cat) => {
            const val = b[cat];
            const num = typeof val === 'number' ? val : (val && typeof val.amount === 'number' ? val.amount : 0);
            aggregated[cat] = (aggregated[cat] || 0) + num;
          });
        });
        console.log('📊 Historical yearly aggregated budgets:', { yearKey, monthKeys, categories: Object.keys(aggregated).length });
        return aggregated;
      }

      // Monthly: strict lookup for the exact requested periodKey, or synthesize an empty period object.
      const periodKey = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}`;
      const periodData = historicalBudgets && historicalBudgets[periodKey]
        ? historicalBudgets[periodKey]
        : { budgets: {}, totals: { totalAmount: 0, totalSpent: 0 }, detailedBudgets: [], expenses: [] };
      console.log('📊 Historical budget display (monthly):', { periodKey, availableKeys, hasData: !!(historicalBudgets && historicalBudgets[periodKey]) });
      return periodData.budgets || {};
    }
    console.log('📊 Current budget display:', {
      hasBudgets: !!budgets,
      budgetType: typeof budgets,
      budgetKeys: budgets ? Object.keys(budgets) : []
    });
    return budgets;
  }, [viewMode, budgets, historicalBudgets, selectedPeriod, selectedYear, selectedMonth, expenses]);

  const displayTotals = useMemo(() => {
    if (viewMode === 'historical') {
      const availableKeys = historicalBudgets ? Object.keys(historicalBudgets) : [];
      if (selectedPeriod === 'yearly') {
        // Aggregate budgets and expenses across all months in the year
        const yearKey = String(selectedYear);
        const monthKeys = (availableKeys || []).filter(k => k === yearKey || k.startsWith(`${yearKey}-`));
        const aggregatedBudgets: Record<string, number> = {};
        const aggregatedExpenses: any[] = [];
        const aggregatedByCat: Record<string, any[]> = {};

        monthKeys.forEach((k) => {
          const pd = historicalBudgets[k] || {};
          const b = pd?.budgets || {};
          Object.keys(b).forEach((cat) => {
            const val = b[cat];
            const num = typeof val === 'number' ? val : (val && typeof val.amount === 'number' ? val.amount : 0);
            aggregatedBudgets[cat] = (aggregatedBudgets[cat] || 0) + num;
          });
          if (Array.isArray(pd?.expenses)) {
            aggregatedExpenses.push(...pd.expenses);
          }
          if (pd?.expensesByCategory && typeof pd.expensesByCategory === 'object') {
            Object.keys(pd.expensesByCategory).forEach((cat) => {
              const arr = Array.isArray(pd.expensesByCategory[cat]) ? pd.expensesByCategory[cat] : [];
              aggregatedByCat[cat] = [...(aggregatedByCat[cat] || []), ...arr];
            });
          }
        });

        const totalBudget = Object.values(aggregatedBudgets).reduce((s, v) => s + (Number(v) || 0), 0);
        const totalSpent = aggregatedExpenses.reduce((s, e) => s + (Number(e?.amount) || 0), 0);
        console.log('📊 Historical yearly totals:', { yearKey, monthKeys, totalBudget, totalSpent });
        return { totalBudget, totalSpent };
      }

      // Monthly
      const periodKey = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}`;
      const periodData = historicalBudgets && historicalBudgets[periodKey]
        ? historicalBudgets[periodKey]
        : { totals: { totalAmount: 0, totalSpent: 0 } };
      let totalBudget = periodData?.totals?.totalAmount ?? 0;
      let totalSpent = periodData?.totals?.totalSpent ?? 0;

      if (!totalBudget) {
        const monthlySum = Object.values(periodData?.budgets || {}).reduce((s: number, v: any) => {
          if (typeof v === 'number') return s + v;
          if (v && typeof v.amount === 'number') return s + v.amount;
          return s;
        }, 0);
        totalBudget = monthlySum;
      }

      if (!totalSpent) {
        if (Array.isArray(periodData?.expenses)) {
          totalSpent = periodData.expenses.reduce((s: number, e: any) => s + (Number(e.amount) || 0), 0);
        } else if (periodData?.expensesByCategory && typeof periodData.expensesByCategory === 'object') {
          totalSpent = Object.values(periodData.expensesByCategory).reduce((s: number, arr: any) => {
            if (!Array.isArray(arr)) return s;
            return s + arr.reduce((ss: number, it: any) => ss + (Number(it.amount) || 0), 0);
          }, 0);
        }
      }

      const totals = { totalBudget, totalSpent };
      console.log('📊 Historical totals (monthly):', { periodKey, totals, availableKeys });
      return totals;
    }
    
    // For current budgets, calculate totals from budgets object and expenses for the current month
    let totalBudget = 0;
    let totalSpent = 0;

    if (budgets && typeof budgets === 'object') {
      Object.values(budgets).forEach((value: any) => {
        if (typeof value === 'number') {
          totalBudget += value;
        } else if (value && typeof value.amount === 'number') {
          totalBudget += value.amount;
        }
      });
    }

    try {
      if (selectedPeriod === 'yearly') {
        // Yearly totals: budget is monthly-sum * 12, spent is sum of expenses for the selectedYear
        const monthlySum = Object.values(budgets || {}).reduce((s: number, v: any) => {
          if (typeof v === 'number') return s + v;
          if (v && typeof v.amount === 'number') return s + v.amount;
          return s;
        }, 0);
        totalBudget = monthlySum * 12;

        if (Array.isArray(expenses)) {
          totalSpent = expenses.reduce((sum: number, exp: any) => {
            const d = exp && exp.createdAt ? new Date(exp.createdAt) : null;
            if (!d || Number.isNaN(d.getTime())) return sum;
            if (d.getFullYear() === selectedYear) {
              return sum + (Number(exp.amount) || 0);
            }
            return sum;
          }, 0);
        }
      } else {
        // Monthly view: use the selectedYear/selectedMonth (not the current date) so selecting a month updates the summary
        const cy = selectedYear || (new Date()).getFullYear();
        const cm = selectedMonth || ((new Date()).getMonth() + 1);
        if (Array.isArray(expenses)) {
          totalSpent = expenses.reduce((sum: number, exp: any) => {
            const d = exp && exp.createdAt ? new Date(exp.createdAt) : null;
            if (!d || Number.isNaN(d.getTime())) return sum;
            if (d.getFullYear() === cy && (d.getMonth() + 1) === cm) {
              return sum + (Number(exp.amount) || 0);
            }
            return sum;
          }, 0);
        }
      }

    } catch (e) {
      totalSpent = 0;
    }

    const totals = { totalBudget, totalSpent };
    console.log('📊 Current totals:', totals);
    return totals;
  }, [viewMode, budgets, historicalBudgets, selectedPeriod, selectedYear, selectedMonth]);

  return { displayBudgetsData, displayTotals };
}
