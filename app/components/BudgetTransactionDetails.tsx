import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Expense, User } from '@/lib/store/financeStore';
import { useTheme } from '../context/ThemeContext';

interface BudgetTransactionDetailsProps {
  category: string;
  expenses: Expense[];
  categoryIcon: string;
  categoryColors: [string, string];
  onClose: () => void;
}

export const BudgetTransactionDetails: React.FC<BudgetTransactionDetailsProps> = ({
  category,
  expenses,
  categoryIcon,
  categoryColors,
  onClose,
}) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  // Group expenses by person (user who created the expense)
  const expensesByPerson = React.useMemo(() => {
    const grouped: Record<string, Expense[]> = {};

    expenses.forEach(expense => {
      // Handle userId as either string or User object
      const personName = typeof expense.userId === 'object' && expense.userId && 'name' in expense.userId
        ? (expense.userId as User).name
        : (typeof expense.userId === 'string' ? expense.userId : 'Unknown');
      if (!grouped[personName]) {
        grouped[personName] = [];
      }
      grouped[personName].push(expense);
    });

    // Sort persons by total spending (highest first)
    return Object.entries(grouped)
      .map(([person, personExpenses]) => ({
        person,
        expenses: personExpenses.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
        total: personExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0),
        count: personExpenses.length
      }))
      .sort((a, b) => b.total - a.total);
  }, [expenses]);

  const totalCategorySpending = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);

  return (
    <View style={styles.overlay}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <LinearGradient colors={categoryColors} style={styles.categoryIcon}>
              <Text style={styles.categoryEmoji}>{categoryIcon}</Text>
            </LinearGradient>
            <View>
              <Text style={styles.categoryTitle}>{category}</Text>
              <Text style={styles.totalAmount}>{theme.currency}{totalCategorySpending.toFixed(2)}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#64748B" />
          </TouchableOpacity>
        </View>

        {/* Transaction Details */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {expensesByPerson.map(({ person, expenses: personExpenses, total, count }) => (
            <View key={person} style={styles.personSection}>
              <View style={styles.personHeader}>
                <View style={styles.personInfo}>
                  <View style={styles.personAvatar}>
                    <Text style={styles.personInitial}>
                      {person.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.personName}>{person}</Text>
                    <Text style={styles.personStats}>
                      {count} transaction{count !== 1 ? 's' : ''} • {theme.currency}{total.toFixed(2)}
                    </Text>
                  </View>
                </View>
                <View style={styles.personTotal}>
                  <Text style={styles.personTotalAmount}>{theme.currency}{total.toFixed(2)}</Text>
                </View>
              </View>

              {/* Individual Transactions */}
              {personExpenses.map((expense) => (
                <View key={expense._id} style={styles.transactionItem}>
                  <View style={styles.transactionLeft}>
                    <Text style={styles.transactionDescription}>
                      {expense.description}
                    </Text>
                    <View style={styles.transactionMeta}>
                      <Text style={styles.transactionDate}>
                        {new Date(expense.createdAt).toLocaleDateString()}
                      </Text>
                      {expense.location && (
                        <Text style={styles.transactionLocation}>📍 {expense.location}</Text>
                      )}
                    </View>
                    {expense.tags && expense.tags.length > 0 && (
                      <View style={styles.tagsContainer}>
                        {expense.tags.slice(0, 2).map((tag, index) => (
                          <Text key={index} style={styles.tag}>#{tag}</Text>
                        ))}
                      </View>
                    )}
                  </View>
                  <View style={styles.transactionRight}>
                    <Text style={styles.transactionAmount}>{theme.currency}{expense.amount?.toFixed(2)}</Text>
                  </View>
                </View>
              ))}
            </View>
          ))}

          {expensesByPerson.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={48} color="#94A3B8" />
              <Text style={styles.emptyTitle}>No transactions</Text>
              <Text style={styles.emptySubtitle}>
                No expenses recorded in this category yet
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  container: {
    backgroundColor: theme.surface || 'white',
    borderRadius: 20,
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.surfaceSecondary || '#F1F5F9',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryEmoji: {
    fontSize: 20,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.text || '#1E293B',
  },
  totalAmount: {
    fontSize: 16,
    color: theme.textSecondary || '#64748B',
    marginTop: 2,
  },
  closeButton: {
    padding: 8,
  },
  content: {
    padding: 20,
  },
  personSection: {
    marginBottom: 24,
  },
  personHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: theme.surfaceSecondary || '#F8FAFC',
    borderRadius: 12,
    marginBottom: 12,
  },
  personInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  personAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.primary || '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  personInitial: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  personName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text || '#1E293B',
  },
  personStats: {
    fontSize: 12,
    color: theme.textSecondary || '#64748B',
    marginTop: 2,
  },
  personTotal: {
    alignItems: 'flex-end',
  },
  personTotalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.text || '#1E293B',
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: theme.surface || 'white',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.surfaceSecondary || '#F1F5F9',
  },
  transactionLeft: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.text || '#1E293B',
    marginBottom: 4,
  },
  transactionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: theme.textSecondary || '#64748B',
  },
  transactionLocation: {
    fontSize: 12,
    color: theme.textSecondary || '#64748B',
    marginLeft: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  tag: {
    fontSize: 10,
    color: theme.primary || '#8B5CF6',
    backgroundColor: theme.surfaceSecondary || '#F3E8FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.error || '#EF4444',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.textSecondary || '#64748B',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.textSecondary || '#94A3B8',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default BudgetTransactionDetails;