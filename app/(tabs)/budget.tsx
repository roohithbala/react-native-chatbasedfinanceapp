import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BudgetHeader } from '../components/BudgetHeader';
import { BudgetSummary } from '../components/BudgetSummary';
import { BudgetList } from '../components/BudgetList';
import { BudgetTransactionDetails } from '../components/BudgetTransactionDetails';
import { AddBudgetModal } from '../components/AddBudgetModal';
import ErrorDisplay from '../components/ErrorDisplay';
import LoadingIndicator from '../components/LoadingIndicator';
import { useBudgetData } from '@/hooks/useBudgetData';
import { useBudgetActions } from '@/hooks/useBudgetActions';
import { useTheme } from '../context/ThemeContext';

export default function BudgetScreen() {
  const { theme } = useTheme();
  const {
    budgets,
    expenses,
    categories,
    categoryIcons,
    categoryColors,
    isLoading,
    error,
    totalBudget,
    totalSpent,
    getSpentAmount,
    getPersonalSpentAmount,
    getGroupSpentAmount,
    getProgressPercentage,
    getProgressColor,
    loadData,
  } = useBudgetData();

  const {
    showAddModal,
    setShowAddModal,
    category,
    setCategory,
    limit,
    setLimit,
    handleSetBudget,
    handleRetry,
  } = useBudgetActions();

  const [showTransactionDetails, setShowTransactionDetails] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [categoryExpenses, setCategoryExpenses] = useState<any[]>([]);

  const handleCategoryPress = (category: string, expenses: any[]) => {
    setSelectedCategory(category);
    setCategoryExpenses(expenses);
    setShowTransactionDetails(true);
  };

  // Load data when component mounts
  useEffect(() => {
    loadData();
  }, [loadData]);

  if (isLoading) {
    return <LoadingIndicator loading={true} message="Loading budgets..." />;
  }

  if (error) {
    return (
      <ErrorDisplay
        error={error}
        onRetry={handleRetry}
      />
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <BudgetHeader />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <BudgetSummary
          totalBudget={typeof totalBudget === 'number' ? totalBudget : 0}
          totalSpent={typeof totalSpent === 'number' ? totalSpent : 0}
        />

        <View style={styles.categoriesSection}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Category Budgets</Text>

          <BudgetList
            categories={categories}
            budgets={budgets}
            categoryIcons={categoryIcons}
            categoryColors={categoryColors}
            getSpentAmount={getSpentAmount}
            getPersonalSpentAmount={getPersonalSpentAmount}
            getGroupSpentAmount={getGroupSpentAmount}
            getProgressPercentage={getProgressPercentage}
            getProgressColor={getProgressColor}
            onAddPress={() => setShowAddModal(true)}
            onCategoryPress={handleCategoryPress}
            expenses={expenses}
          />
        </View>
      </ScrollView>

      <AddBudgetModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleSetBudget}
        category={category}
        onCategoryChange={setCategory}
        limit={limit}
        onLimitChange={setLimit}
        categories={categories}
        categoryIcons={categoryIcons}
      />

      {showTransactionDetails && (
        <BudgetTransactionDetails
          category={selectedCategory}
          expenses={categoryExpenses}
          categoryIcon={categoryIcons[selectedCategory as keyof typeof categoryIcons]}
          categoryColors={categoryColors[selectedCategory as keyof typeof categoryColors] as [string, string]}
          onClose={() => setShowTransactionDetails(false)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  categoriesSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
});