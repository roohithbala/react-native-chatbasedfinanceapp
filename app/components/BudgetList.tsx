import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ColorValue, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BudgetCard } from './BudgetCard';

interface BudgetListProps {
  categories: string[];
  budgets: Record<string, number>;
  categoryIcons: Record<string, string>;
  categoryColors: Record<string, [ColorValue, ColorValue]>;
  getSpentAmount: (category: string) => number;
  getPersonalSpentAmount?: (category: string) => number;
  getGroupSpentAmount?: (category: string) => number;
  getProgressPercentage: (spent: number, limit: number) => number;
  getProgressColor: (percentage: number) => string;
  onAddPress: () => void;
  onCategoryPress?: (category: string, expenses: any[]) => void;
  expenses?: any[];
  refreshing?: boolean;
  onRefresh?: () => void;
  listHeaderComponent?: React.ReactNode;
}

export const BudgetList: React.FC<BudgetListProps> = ({
  categories,
  budgets,
  categoryIcons,
  categoryColors,
  getSpentAmount,
  getPersonalSpentAmount,
  getGroupSpentAmount,
  getProgressPercentage,
  getProgressColor,
  onAddPress,
  onCategoryPress,
  expenses = [],
  refreshing = false,
  onRefresh,
  listHeaderComponent,
}) => {
  const renderItem = ({ item: cat }: { item: string }) => {
    const budgetLimit = typeof budgets?.[cat] === 'number' ? budgets[cat] : 0;
    const spentAmount = getSpentAmount(cat) || 0;
    const progressPercentage = getProgressPercentage(spentAmount, budgetLimit) || 0;
    const progressColor = getProgressColor(progressPercentage);

    const getExpenseCategory = (expense: any) => {
      if (!expense || typeof expense !== 'object') return '';
      return (
        expense.category || expense.categoryName || expense.categoryKey || (expense.tags && expense.tags[0]) || ''
      ).toString();
    };

    const categoryExpenses = (Array.isArray(expenses) ? expenses : [])
      .filter(expense => {
        const expCat = getExpenseCategory(expense).toLowerCase();
        return expCat && expCat === (cat || '').toString().toLowerCase();
      });

    return (
      <BudgetCard
        key={cat}
        category={cat}
        budgetLimit={budgetLimit}
        spentAmount={spentAmount}
        progressPercentage={progressPercentage}
        progressColor={progressColor}
        categoryIcon={categoryIcons[cat as keyof typeof categoryIcons]}
        categoryColors={categoryColors[cat as keyof typeof categoryColors]}
        onPress={() => onCategoryPress && onCategoryPress(cat, categoryExpenses)}
        showDetailsButton={true}
      />
    );
  };

  return (
    <View style={[styles.container, { flex: 1 }]}> 
      <FlatList
        data={categories}
        keyExtractor={(item) => item}
        renderItem={renderItem}
        contentContainerStyle={[{ paddingBottom: 40 }, styles.contentContainer]}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListHeaderComponent={() => (
          <>
            {listHeaderComponent}
            <TouchableOpacity
              style={styles.addButton}
              onPress={onAddPress}
            >
              <Ionicons name="add" size={20} color="#2563EB" />
              <Text style={styles.addButtonText}>Add Budget</Text>
            </TouchableOpacity>
          </>
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No categories or budgets to show</Text>
          </View>
        )}
        style={{ flex: 1 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 12,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
    gap: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563EB',
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748B',
    fontSize: 14,
  },
});

export default BudgetList;