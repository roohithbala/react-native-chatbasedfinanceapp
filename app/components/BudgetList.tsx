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
  getPersonalSpentAmount?: (category: string) => number;
  getGroupSpentAmount?: (category: string) => number;
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
  getPersonalSpentAmount,
  getGroupSpentAmount,
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
        // Ensure all values are valid numbers
        const budgetLimit = typeof budgets?.[cat] === 'number' ? budgets[cat] : 0;
        const spentAmount = getSpentAmount(cat) || 0;
        const progressPercentage = getProgressPercentage(spentAmount, budgetLimit) || 0;
        const progressColor = getProgressColor(progressPercentage);

        // Filter ALL expenses for this category (both personal and group)
        const categoryExpenses = expenses.filter(expense =>
          expense && typeof expense === 'object' &&
          expense.category === cat
        );

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