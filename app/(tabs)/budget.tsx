import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ColorValue,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFinanceStore } from '../../lib/store/financeStore';

export default function BudgetScreen() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [category, setCategory] = useState('Food');
  const [limit, setLimit] = useState('');
  const [selectedBudgetType, setSelectedBudgetType] = useState<'personal' | 'group'>('personal');
  const { 
    budgets, 
    expenses, 
    setBudget, 
    loadExpenses, 
    loadBudgets,
    isLoading,
    error,
    selectedGroup
  } = useFinanceStore();

  // Load expenses and budgets when component mounts or when budget type/group changes
  React.useEffect(() => {
    const loadData = async () => {
      try {
        console.log('Loading budget data for type:', selectedBudgetType, 'group:', selectedGroup?.name);
        const groupId = selectedBudgetType === 'group' && selectedGroup ? selectedGroup._id : undefined;
        await Promise.all([
          loadExpenses(),
          loadBudgets(groupId)
        ]);
        console.log('Budget data loaded successfully');
      } catch (err) {
        console.error('Error loading budget data:', err);
        // Error is already handled in the store, just log here
        // Alert.alert is handled in the store's loadExpenses function
      }
    };
    loadData();
  }, [selectedBudgetType, selectedGroup, loadBudgets, loadExpenses]);

  const categories = ['Food', 'Transport', 'Entertainment', 'Shopping', 'Bills', 'Health', 'Other'];
  const categoryIcons = {
    Food: '🍽️',
    Transport: '🚗',
    Entertainment: '🎬',
    Shopping: '🛍️',
    Bills: '📄',
    Health: '🏥',
    Other: '📋',
  };

  const categoryColors: Record<string, [ColorValue, ColorValue]> = {
    Food: ['#EF4444', '#F87171'],
    Transport: ['#3B82F6', '#60A5FA'],
    Entertainment: ['#8B5CF6', '#A78BFA'],
    Shopping: ['#F59E0B', '#FBBF24'],
    Bills: ['#10B981', '#34D399'],
    Health: ['#EC4899', '#F472B6'],
    Other: ['#6B7280', '#9CA3AF'],
  };

  const getSpentAmount = (category: string) => {
    if (!expenses || !Array.isArray(expenses)) {
      console.log('No expenses array available');
      return 0;
    }

    let filteredExpenses;
    if (selectedBudgetType === 'group' && selectedGroup) {
      // For group budgets, only count expenses from the selected group
      filteredExpenses = expenses.filter(expense =>
        expense && typeof expense === 'object' &&
        expense.category === category &&
        expense.groupId === selectedGroup._id
      );
      console.log(`Group expenses for ${category}:`, filteredExpenses.length, 'expenses found');
    } else {
      // For personal budgets, count all personal expenses
      filteredExpenses = expenses.filter(expense =>
        expense && typeof expense === 'object' &&
        expense.category === category
      );
      console.log(`Personal expenses for ${category}:`, filteredExpenses.length, 'expenses found');
    }

    const total = filteredExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
    console.log(`Total spent for ${category}:`, total);
    return total;
  };

  const getProgressPercentage = (spent: number, limit: number) => {
    if (limit === 0) return 0;
    return Math.min((spent / limit) * 100, 100);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return '#EF4444';
    if (percentage >= 70) return '#F59E0B';
    return '#10B981';
  };

  const handleSetBudget = async () => {
    if (!limit.trim()) {
      Alert.alert('Error', 'Please enter a budget limit');
      return;
    }

    const budgetLimit = parseFloat(limit);
    if (isNaN(budgetLimit) || budgetLimit <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    try {
      const groupId = selectedBudgetType === 'group' && selectedGroup ? selectedGroup._id : undefined;
      await setBudget(category, budgetLimit, groupId);
      setLimit('');
      setShowAddModal(false);
      Alert.alert('Success', `Budget set for ${category}!`);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to set budget');
    }
  };

  const totalBudget = Object.values(budgets || {}).reduce((sum, budget) => sum + (typeof budget === 'number' ? budget : 0), 0);
  const totalSpent = Array.isArray(expenses) ? expenses.reduce((sum, expense) => sum + (expense?.amount || 0), 0) : 0;

  console.log('Budgets state:', budgets);
  console.log('Total budget:', totalBudget);
  console.log('Total spent:', totalSpent);

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <Text>Loading budgets...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => {
            loadExpenses().catch(console.error);
            loadBudgets().catch(console.error);
          }}
        >
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#8B5CF6', '#7C3AED']} style={styles.header}>
        <Text style={styles.headerTitle}>Budget</Text>
        
        {/* Budget Type Selection */}
        <View style={styles.budgetTypeContainer}>
          <TouchableOpacity
            style={[
              styles.budgetTypeButton,
              selectedBudgetType === 'personal' && styles.budgetTypeButtonActive,
            ]}
            onPress={() => setSelectedBudgetType('personal')}
          >
            <Text style={[
              styles.budgetTypeText,
              selectedBudgetType === 'personal' && styles.budgetTypeTextActive,
            ]}>
              Personal
            </Text>
          </TouchableOpacity>
          {selectedGroup && (
            <TouchableOpacity
              style={[
                styles.budgetTypeButton,
                selectedBudgetType === 'group' && styles.budgetTypeButtonActive,
              ]}
              onPress={() => setSelectedBudgetType('group')}
            >
              <Text style={[
                styles.budgetTypeText,
                selectedBudgetType === 'group' && styles.budgetTypeTextActive,
              ]}>
                {selectedGroup.name}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Budget</Text>
            <Text style={styles.summaryValue}>₹{totalBudget.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Spent</Text>
            <Text style={[styles.summaryValue, { color: '#EF4444' }]}>
              ₹{totalSpent.toFixed(2)}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Remaining</Text>
            <Text
              style={[
                styles.summaryValue,
                { color: totalBudget - totalSpent >= 0 ? '#10B981' : '#EF4444' },
              ]}
            >
              ₹{(totalBudget - totalSpent).toFixed(2)}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Category Budgets</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddModal(true)}
          >
            <Ionicons name="add" size={20} color="#2563EB" />
          </TouchableOpacity>
        </View>

        {categories.map((cat) => {
          const budgetLimit = budgets[cat] || 0;
          const spentAmount = getSpentAmount(cat);
          const progressPercentage = getProgressPercentage(spentAmount, budgetLimit);
          const progressColor = getProgressColor(progressPercentage);

          return (
            <View key={cat} style={styles.budgetCard}>
              <View style={styles.budgetHeader}>
                <View style={styles.categoryInfo}>
                  <LinearGradient
                    colors={categoryColors[cat as keyof typeof categoryColors]}
                    style={styles.categoryIcon}
                  >
                    <Text style={styles.categoryEmoji}>
                      {categoryIcons[cat as keyof typeof categoryIcons]}
                    </Text>
                  </LinearGradient>
                  <View style={styles.categoryDetails}>
                    <Text style={styles.categoryName}>{cat}</Text>
                    <Text style={styles.budgetRange}>
                      ₹{spentAmount.toFixed(2)} / ₹{budgetLimit.toFixed(2)}
                    </Text>
                  </View>
                </View>
                <View style={styles.budgetStatus}>
                  <Text
                    style={[
                      styles.progressPercentage,
                      { color: progressColor },
                    ]}
                  >
                    {progressPercentage.toFixed(0)}%
                  </Text>
                  {progressPercentage >= 90 && (
                    <Ionicons name="warning" size={16} color="#EF4444" />
                  )}
                </View>
              </View>

              <View style={styles.progressContainer}>
                <View style={styles.progressTrack}>
                  <LinearGradient
                    colors={[progressColor, progressColor]}
                    style={[
                      styles.progressFill,
                      { width: `${progressPercentage}%` },
                    ]}
                  />
                </View>
              </View>

              {progressPercentage >= 90 && (
                <View style={styles.warningContainer}>
                  <Text style={styles.warningText}>
                    ⚠️ You&apos;re approaching your budget limit!
                  </Text>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Set Budget</Text>
            <TouchableOpacity onPress={handleSetBudget}>
              <Text style={styles.modalSave}>Save</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Category</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.categoryScroll}
              >
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryChip,
                      category === cat && styles.categoryChipActive,
                    ]}
                    onPress={() => setCategory(cat)}
                  >
                    <Text style={styles.categoryEmoji}>
                      {categoryIcons[cat as keyof typeof categoryIcons]}
                    </Text>
                    <Text
                      style={[
                        styles.categoryText,
                        category === cat && styles.categoryTextActive,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Budget Limit</Text>
              <TextInput
                style={styles.textInput}
                value={limit}
                onChangeText={setLimit}
                placeholder="0.00"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
              />
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
  },
  summaryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  summaryValue: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginVertical: 12,
  },
  content: {
    flex: 1,
    padding: 20,
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
    color: '#1E293B',
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  budgetCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryInfo: {
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
  categoryDetails: {
    flex: 1,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  budgetRange: {
    fontSize: 14,
    color: '#64748B',
  },
  budgetStatus: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 8,
  },
  progressPercentage: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  warningContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  warningText: {
    fontSize: 14,
    color: '#DC2626',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: 'white',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  modalCancel: {
    fontSize: 16,
    color: '#64748B',
  },
  modalSave: {
    fontSize: 16,
    color: '#8B5CF6',
    fontWeight: '600',
  },
  modalContent: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  categoryScroll: {
    marginTop: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryChipActive: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  categoryText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  categoryTextActive: {
    color: 'white',
  },
  textInput: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    color: '#1E293B',
  },
  budgetTypeContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    padding: 2,
    marginBottom: 16,
  },
  budgetTypeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  budgetTypeButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  budgetTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  budgetTypeTextActive: {
    color: 'white',
  },
});