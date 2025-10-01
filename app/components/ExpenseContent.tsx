import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import ViewModeSelector from './ViewModeSelector';
import ExpenseList from './ExpenseList';
import GroupExpenseStats from './GroupExpenseStats';
import SplitBillsSection from './SplitBillsSection';
import { Expense } from '@/lib/store/financeStore';
import { useTheme } from '../context/ThemeContext';

interface ExpenseContentProps {
  activeTab: 'expenses' | 'splitBills';
  viewMode: 'list' | 'category' | 'participants';
  onViewModeChange: (mode: 'list' | 'category' | 'participants') => void;
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
  const { theme } = useTheme();
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
            splitBills={splitBills}
            currentUser={currentUser}
          />

          {selectedGroup && (
            <>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>📊 Group Stats</Text>
              <GroupExpenseStats groupId={selectedGroup._id} />
            </>
          )}
        </>
      ) : (
        <>
          <SplitBillsSection
            splitBills={splitBills}
            currentUser={currentUser}
            splitBillTab={splitBillTab}
            onSplitBillTabChange={onSplitBillTabChange}
            onMarkAsPaid={onMarkAsPaid}
          />

          {selectedGroup && (
            <>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>📊 Group Stats</Text>
              <GroupExpenseStats groupId={selectedGroup._id} />
            </>
          )}
        </>
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
    marginBottom: 16,
    marginTop: 8,
  },
});