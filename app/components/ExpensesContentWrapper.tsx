import React from 'react';
import ErrorDisplay from '@/app/components/ErrorDisplay';
import LoadingIndicator from '@/app/components/LoadingIndicator';
import ExpenseContent from '@/app/components/ExpenseContent';

type Props = {
  storeError?: any;
  storeLoading?: boolean;
  onRetry?: () => void;
  // props for ExpenseContent
  activeTab: string;
  viewMode: string;
  onViewModeChange: (v: any) => void;
  filteredExpenses: any[];
  onEditExpense: (e: any) => void;
  onDeleteExpense: (id: string) => void;
  selectedGroup: any;
  splitBills: any[];
  currentUser: any;
  splitBillTab: string;
  onSplitBillTabChange: (t: string) => void;
  onMarkAsPaid: (id: string) => void;
};

export default function ExpensesContentWrapper(props: Props) {
  const { storeError, storeLoading, onRetry, ...expenseProps } = props as any;
  return (
    <>
      <ErrorDisplay error={storeError} onRetry={onRetry} />
      <LoadingIndicator loading={!!storeLoading} />
      <ExpenseContent {...expenseProps} />
    </>
  );
}
