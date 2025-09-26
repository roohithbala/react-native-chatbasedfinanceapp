import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../context/ThemeContext';

interface Expense {
  _id: string;
  description: string;
  amount: number;
  category: string;
  createdAt: string | Date;
}

interface RecentExpensesProps {
  expenses: Expense[];
}

export default function RecentExpenses({ expenses }: RecentExpensesProps) {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Expenses</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/expenses')}>
          <Text style={styles.seeAllButton}>See All</Text>
        </TouchableOpacity>
      </View>
      {expenses.length > 0 ? (
        expenses.map((expense, index) => (
          <View key={expense._id || index} style={styles.expenseItem}>
            <View style={styles.expenseIcon}>
              <Ionicons
                name={getCategoryIcon(expense.category) as any}
                size={20}
                color={theme.textSecondary || '#6B7280'}
              />
            </View>
            <View style={styles.expenseDetails}>
              <Text style={styles.expenseDescription}>
                {expense.description}
              </Text>
              <Text style={styles.expenseDate}>
                {new Date(expense.createdAt).toLocaleDateString()}
              </Text>
            </View>
            <Text style={styles.expenseAmount}>
              -{theme.currency}{expense.amount.toFixed(2)}
            </Text>
          </View>
        ))
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="receipt-outline" size={32} color={theme.textSecondary || '#CBD5E1'} />
          <Text style={styles.emptyStateText}>No recent expenses</Text>
        </View>
      )}
    </View>
  );
}

function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    'Food': 'restaurant',
    'Transport': 'car',
    'Entertainment': 'game-controller',
    'Shopping': 'bag',
    'Bills': 'receipt',
    'Health': 'medical',
    'Education': 'school',
    'Other': 'ellipsis-horizontal'
  };
  return icons[category] || 'ellipsis-horizontal';
}

const getStyles = (theme: any) => StyleSheet.create({
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.text || '#1E293B',
  },
  seeAllButton: {
    fontSize: 14,
    color: theme.primary || '#2563EB',
    fontWeight: '600',
  },
  expenseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface || 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  expenseIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.surfaceSecondary || '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  expenseDetails: {
    flex: 1,
  },
  expenseDescription: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.text || '#1E293B',
    marginBottom: 2,
  },
  expenseDate: {
    fontSize: 14,
    color: theme.textSecondary || '#64748B',
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.error || '#EF4444',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyStateText: {
    fontSize: 14,
    color: theme.textSecondary || '#64748B',
    marginTop: 8,
  },
});

export { RecentExpenses };