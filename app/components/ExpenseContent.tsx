import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import ViewModeSelector from './ViewModeSelector';
import ExpenseList from './ExpenseList';
import GroupExpenseStats from './GroupExpenseStats';
import SplitBillsSection from './SplitBillsSection';
import { Expense } from '@/lib/store/financeStore';

interface ExpenseContentProps {
  activeTab: 'expenses' | 'splitBills';
  viewMode: 'list' | 'category';
  onViewModeChange: (mode: 'list' | 'category') => void;
  filteredExpenses: Expense[];
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (expense: Expense) => void;
  selectedGroup: any;
  splitBills: any[];
  currentUser: any;
  splitBillTab: 'awaiting' | 'settled';
  onSplitBillTabChange: (tab: 'awaiting' | 'settled') => void;
  onMarkAsPaid: (billId: string) => void;
}

export default function ExpenseContent({
  activeTab,
  viewMode,
  onViewModeChange,
  filteredExpenses,
  onEditExpense,
  onDeleteExpense,
  selectedGroup,
  splitBills,
  currentUser,
  splitBillTab,
  onSplitBillTabChange,
  onMarkAsPaid,
}: ExpenseContentProps) {
  return (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      {activeTab === 'expenses' ? (
        <>
          <ViewModeSelector
            viewMode={viewMode}
            onViewModeChange={onViewModeChange}
          />

          <ExpenseList
            expenses={filteredExpenses}
            viewMode={viewMode}
            onEditExpense={onEditExpense}
            onDeleteExpense={onDeleteExpense}
          />

          {selectedGroup && (
            <>
              <Text style={styles.sectionTitle}>📊 Group Stats</Text>
              <GroupExpenseStats groupId={selectedGroup._id} />
            </>
          )}
        </>
      ) : (
        <SplitBillsSection
          splitBills={splitBills}
          currentUser={currentUser}
          splitBillTab={splitBillTab}
          onSplitBillTabChange={onSplitBillTabChange}
          onMarkAsPaid={onMarkAsPaid}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 16,
    marginTop: 8,
  },
});