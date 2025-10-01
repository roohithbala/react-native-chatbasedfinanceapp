import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFinanceStore, Expense } from '@/lib/store/financeStore';
import { useTheme } from '../context/ThemeContext';

interface ExpenseListProps {
  expenses: Expense[];
  viewMode: 'list' | 'category' | 'participants';
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (expense: Expense) => void;
  splitBills?: any[];
  currentUser?: any;
}

const categoryIcons = {
  Food: '🍽️',
  Transport: '🚗',
  Entertainment: '🎬',
  Shopping: '🛍️',
  Bills: '📄',
  Health: '🏥',
  Education: '📚',
  Travel: '✈️',
  Utilities: '⚡',
  Other: '📋',
};

export default function ExpenseList({
  expenses,
  viewMode,
  onEditExpense,
  onDeleteExpense,
  splitBills = [],
  currentUser
}: ExpenseListProps) {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  // Group expenses by category
  const expensesByCategory = React.useMemo(() => {
    const grouped = expenses.reduce((acc, expense) => {
      const cat = expense.category || 'Other';
      if (!acc[cat]) {
        acc[cat] = [];
      }
      acc[cat].push(expense);
      return acc;
    }, {} as Record<string, Expense[]>);

    // Convert to section list format
    return Object.entries(grouped).map(([category, categoryExpenses]) => ({
      title: category,
      data: categoryExpenses.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
      total: categoryExpenses.reduce((sum, exp) => sum + exp.amount, 0)
    })).sort((a, b) => b.total - a.total);
  }, [expenses]);

  // Group expenses by participants (payers)
  const expensesByParticipant = React.useMemo(() => {
    const grouped = expenses.reduce((acc, expense) => {
      // For now, we'll group by userId (assuming expenses have userId of the payer)
      // In a real app, you might want to show both payers and participants
      const participantId: string = typeof expense.userId === 'object' && expense.userId?._id
        ? expense.userId._id
        : (expense.userId as string) || 'Unknown';
      const participantName = participantId === currentUser?._id ? 'You' : 'Other User';

      if (!acc[participantId]) {
        acc[participantId] = {
          name: participantName,
          expenses: [],
          total: 0
        };
      }
      acc[participantId].expenses.push(expense);
      acc[participantId].total += expense.amount;
      return acc;
    }, {} as Record<string, { name: string; expenses: Expense[]; total: number }>);

    // Convert to array and sort by total
    return Object.values(grouped).sort((a, b) => b.total - a.total);
  }, [expenses, currentUser]);

  const handleDeleteExpense = (expense: Expense) => {
    Alert.alert(
      'Delete Expense',
      `Are you sure you want to delete "${expense.description}"?\n\nAmount: ${theme.currency}${(expense.amount || 0).toFixed(2)}\nCategory: ${expense.category}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDeleteExpense(expense),
        },
      ]
    );
  };

  if (expenses.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="receipt-outline" size={64} color={theme.textSecondary || '#94A3B8'} />
        <Text style={styles.emptyTitle}>No expenses yet</Text>
        <Text style={styles.emptySubtitle}>Start tracking your spending by adding your first expense!</Text>
      </View>
    );
  }

  if (viewMode === 'category') {
    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        {expensesByCategory.map((section) => (
          <View key={section.title} style={styles.categorySection}>
            <View style={styles.categoryHeader}>
              <View style={styles.categoryHeaderLeft}>
                <Text style={styles.categoryEmoji}>
                  {categoryIcons[section.title as keyof typeof categoryIcons]}
                </Text>
                <Text style={styles.categoryTitle}>{section.title}</Text>
                <Text style={styles.categoryCount}>({section.data.length})</Text>
              </View>
              <Text style={styles.categoryTotal}>{theme.currency}{(section.total || 0).toFixed(2)}</Text>
            </View>
            {section.data.map((expense) => (
              <View key={expense._id} style={[styles.expenseCard, { backgroundColor: theme.surface }]}>
                <View style={styles.expenseHeader}>
                  <View style={styles.expenseDetails}>
                    <Text style={styles.expenseDescription}>{expense.description}</Text>
                    <View style={styles.expenseMeta}>
                      <Text style={styles.expenseDate}>
                        {new Date(expense.createdAt).toLocaleDateString()}
                      </Text>
                      {expense.location && (
                        <Text style={styles.expenseLocation}>📍 {expense.location}</Text>
                      )}
                    </View>
                    <View style={styles.expenseMeta}>
                      <Text style={styles.expenseCategory}>{expense.category}</Text>
                      <View style={styles.contextIndicator}>
                        <Ionicons
                          name={expense.groupId ? "people" : "person"}
                          size={12}
                          color={expense.groupId ? theme.primary || '#8B5CF6' : theme.textSecondary || '#64748B'}
                        />
                        <Text style={[styles.contextText, { color: expense.groupId ? theme.primary || '#8B5CF6' : theme.textSecondary || '#64748B' }]}>
                          {expense.groupId ? 'Group' : 'Personal'}
                        </Text>
                      </View>
                    </View>
                    {expense.tags && expense.tags.length > 0 && (
                      <View style={styles.tagsContainer}>
                        {expense.tags.slice(0, 3).map((tag, index) => (
                          <Text key={index} style={styles.tag}>#{tag}</Text>
                        ))}
                      </View>
                    )}
                  </View>
                  <View style={styles.expenseRight}>
                    <Text style={styles.expenseAmount}>{theme.currency}{(expense.amount || 0).toFixed(2)}</Text>
                    <View style={styles.expenseActions}>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => onEditExpense(expense)}
                      >
                        <Ionicons name="pencil" size={16} color={theme.textSecondary || '#6B7280'} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleDeleteExpense(expense)}
                      >
                        <Ionicons name="trash" size={16} color={theme.error || '#EF4444'} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    );
  }

  if (viewMode === 'participants') {
    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        {expensesByParticipant.map((participant, index) => (
          <View key={index} style={styles.categorySection}>
            <View style={styles.categoryHeader}>
              <View style={styles.categoryHeaderLeft}>
                <Text style={styles.categoryEmoji}>👤</Text>
                <Text style={styles.categoryTitle}>{participant.name}</Text>
                <Text style={styles.categoryCount}>({participant.expenses.length})</Text>
              </View>
              <Text style={styles.categoryTotal}>{theme.currency}{(participant.total || 0).toFixed(2)}</Text>
            </View>
            {participant.expenses.map((expense) => (
              <View key={expense._id} style={[styles.expenseCard, { backgroundColor: theme.surface }]}>
                <View style={styles.expenseHeader}>
                  <View style={styles.expenseDetails}>
                    <Text style={styles.expenseDescription}>{expense.description}</Text>
                    <View style={styles.expenseMeta}>
                      <Text style={styles.expenseDate}>
                        {new Date(expense.createdAt).toLocaleDateString()}
                      </Text>
                      <View style={styles.contextIndicator}>
                        <Ionicons
                          name={expense.groupId ? "people" : "person"}
                          size={12}
                          color={expense.groupId ? theme.primary || '#8B5CF6' : theme.textSecondary || '#64748B'}
                        />
                        <Text style={[styles.contextText, { color: expense.groupId ? theme.primary || '#8B5CF6' : theme.textSecondary || '#64748B' }]}>
                          {expense.groupId ? 'Group' : 'Personal'}
                        </Text>
                      </View>
                    </View>
                    {expense.location && (
                      <Text style={styles.expenseLocation}>📍 {expense.location}</Text>
                    )}
                    {expense.tags && expense.tags.length > 0 && (
                      <View style={styles.tagsContainer}>
                        {expense.tags.slice(0, 3).map((tag, index) => (
                          <Text key={index} style={styles.tag}>#{tag}</Text>
                        ))}
                      </View>
                    )}
                  </View>
                  <View style={styles.expenseRight}>
                    <Text style={styles.expenseAmount}>{theme.currency}{(expense.amount || 0).toFixed(2)}</Text>
                    <View style={styles.expenseActions}>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => onEditExpense(expense)}
                      >
                        <Ionicons name="pencil" size={16} color={theme.textSecondary || '#6B7280'} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleDeleteExpense(expense)}
                      >
                        <Ionicons name="trash" size={16} color={theme.error || '#EF4444'} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    );
  }

  // List view
  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      {expenses
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .map((expense) => (
          <View key={expense._id} style={[styles.expenseCard, { backgroundColor: theme.surface }]}>
            <View style={styles.expenseHeader}>
              <View style={styles.expenseIcon}>
                <Text style={styles.categoryEmoji}>
                  {categoryIcons[expense.category as keyof typeof categoryIcons]}
                </Text>
              </View>
              <View style={styles.expenseDetails}>
                <Text style={styles.expenseDescription}>{expense.description}</Text>
                <Text style={styles.expenseCategory}>{expense.category}</Text>
                <View style={styles.expenseMeta}>
                  <Text style={styles.expenseDate}>
                    {new Date(expense.createdAt).toLocaleDateString()}
                  </Text>
                  <View style={styles.contextIndicator}>
                    <Ionicons
                      name={expense.groupId ? "people" : "person"}
                      size={12}
                      color={expense.groupId ? theme.primary || '#8B5CF6' : theme.textSecondary || '#64748B'}
                    />
                    <Text style={[styles.contextText, { color: expense.groupId ? theme.primary || '#8B5CF6' : theme.textSecondary || '#64748B' }]}>
                      {expense.groupId ? 'Group' : 'Personal'}
                    </Text>
                  </View>
                </View>
                {expense.location && (
                  <Text style={styles.expenseLocation}>📍 {expense.location}</Text>
                )}
                {expense.tags && expense.tags.length > 0 && (
                  <View style={styles.tagsContainer}>
                    {expense.tags.slice(0, 3).map((tag, index) => (
                      <Text key={index} style={styles.tag}>#{tag}</Text>
                    ))}
                  </View>
                )}
              </View>
              <View style={styles.expenseRight}>
                <Text style={styles.expenseAmount}>{theme.currency}{(expense.amount || 0).toFixed(2)}</Text>
                <View style={styles.expenseActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => onEditExpense(expense)}
                  >
                    <Ionicons name="pencil" size={16} color={theme.textSecondary || '#6B7280'} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleDeleteExpense(expense)}
                  >
                    <Ionicons name="trash" size={16} color={theme.error || '#EF4444'} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        ))}
    </ScrollView>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  emptyState: {
    alignItems: 'center',
    padding: 40,
    marginBottom: 32,
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
  categorySection: {
    marginBottom: 20,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.surfaceSecondary || '#F8FAFC',
    borderRadius: 8,
    marginBottom: 8,
  },
  categoryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryEmoji: {
    fontSize: 20,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text || '#1E293B',
    marginLeft: 8,
  },
  categoryCount: {
    fontSize: 14,
    color: theme.textSecondary || '#64748B',
    marginLeft: 4,
  },
  categoryTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.success || '#059669',
  },
  expenseCard: {
    backgroundColor: theme.surface || 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  expenseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expenseIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.surfaceSecondary || '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  expenseDetails: {
    flex: 1,
  },
  expenseDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text || '#1E293B',
    marginBottom: 4,
  },
  expenseCategory: {
    fontSize: 14,
    color: theme.textSecondary || '#64748B',
    marginBottom: 2,
  },
  expenseDate: {
    fontSize: 12,
    color: theme.textSecondary || '#94A3B8',
  },
  expenseAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.error || '#EF4444',
  },
  expenseRight: {
    alignItems: 'flex-end',
  },
  expenseActions: {
    flexDirection: 'row',
    marginTop: 4,
  },
  actionButton: {
    padding: 4,
    marginLeft: 8,
  },
  expenseMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  expenseLocation: {
    fontSize: 12,
    color: theme.textSecondary || '#64748B',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  tag: {
    fontSize: 11,
    color: theme.primary || '#8B5CF6',
    backgroundColor: theme.surfaceSecondary || '#F3E8FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  contextIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  contextText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
});