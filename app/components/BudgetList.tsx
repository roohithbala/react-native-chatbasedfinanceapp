import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ColorValue } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BudgetCard } from './BudgetCard';

interface BudgetListProps {
  categories: string[];
  budgets: Record<string, number>;
  categoryIcons: Record<string, string>;
  categoryColors: Record<string, [ColorValue, ColorValue]>;
  getSpentAmount: (category: string) => number;
  getProgressPercentage: (spent: number, limit: number) => number;
  getProgressColor: (percentage: number) => string;
  onAddPress: () => void;
  onCategoryPress?: (category: string, expenses: any[]) => void;
  expenses?: any[];
}

export const BudgetList: React.FC<BudgetListProps> = ({
  categories,
  budgets,
  categoryIcons,
  categoryColors,
  getSpentAmount,
  getProgressPercentage,
  getProgressColor,
  onAddPress,
  onCategoryPress,
  expenses = [],
}) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.addButton}
        onPress={onAddPress}
      >
        <Ionicons name="add" size={20} color="#2563EB" />
        <Text style={styles.addButtonText}>Add Budget</Text>
      </TouchableOpacity>

      {categories.map((cat) => {
        const budgetLimit = budgets[cat] || 0;
        const spentAmount = getSpentAmount(cat);
        const progressPercentage = getProgressPercentage(spentAmount, budgetLimit);
        const progressColor = getProgressColor(progressPercentage);

        // Filter expenses for this category (personal expenses only)
        const categoryExpenses = expenses.filter(expense =>
          expense && typeof expense === 'object' &&
          expense.category === cat &&
          !expense.groupId
        );

        return (
          <BudgetCard
            key={cat}
            category={cat}
            budgetLimit={budgets[cat] || 0}
            spentAmount={getSpentAmount(cat)}
            progressPercentage={getProgressPercentage(getSpentAmount(cat), budgets[cat] || 0)}
            progressColor={getProgressColor(getProgressPercentage(getSpentAmount(cat), budgets[cat] || 0))}
            categoryIcon={categoryIcons[cat as keyof typeof categoryIcons]}
            categoryColors={categoryColors[cat as keyof typeof categoryColors]}
            onPress={() => onCategoryPress && onCategoryPress(cat, categoryExpenses)}
            showDetailsButton={true}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // No padding here since it's handled by parent
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
});

export default BudgetList;