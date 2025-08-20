import React, { useState, useMemo } from 'react';
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
  SectionList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFinanceStore, Expense } from '@/lib/store/financeStore';
import SplitBillCard from '@/app/components/SplitBillCard';
import GroupExpenseStats from '@/app/components/GroupExpenseStats';

export default function ExpensesScreen() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'category'>('category');
  const { 
    expenses: rawExpenses, 
    addExpense, 
    updateExpense,
    deleteExpense,
    splitBills: rawSplitBills, 
    currentUser, 
    selectedGroup 
  } = useFinanceStore();

  // Ensure expenses and splitBills are always arrays
  const expenses = Array.isArray(rawExpenses) ? rawExpenses : [];
  const splitBills = Array.isArray(rawSplitBills) ? rawSplitBills : [];

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

  // Group expenses by category
  const expensesByCategory = useMemo(() => {
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

  const handleMarkAsPaid = async (billId: string) => {
    try {
      setLoading(true);
      await useFinanceStore.getState().markSplitBillAsPaid(billId);
      Alert.alert('Success', 'Payment marked as completed');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to mark payment as paid');
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async () => {
    if (!description.trim() || !amount.trim()) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    const expenseAmount = parseFloat(amount);
    if (isNaN(expenseAmount) || expenseAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (!currentUser) {
      Alert.alert('Error', 'Please log in to add expenses');
      return;
    }

    try {
      setLoading(true);
      
      // Create new expense without _id, it will be assigned by the server
      const newExpense = {
        description: description.trim(),
        amount: expenseAmount,
        category,
        userId: currentUser._id,
        createdAt: new Date(),
      };

      await addExpense(newExpense);
      
      // Clear form and close modal only after successful addition
      setDescription('');
      setAmount('');
      setShowAddModal(false);
      Alert.alert('Success', 'Expense added successfully!');
    } catch (error: any) {
      console.error('Add expense error:', error);
      Alert.alert('Error', error.message || 'Failed to add expense');
    } finally {
      setLoading(false);
    }
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setDescription(expense.description);
    setAmount(expense.amount.toString());
    setCategory(expense.category);
    setShowEditModal(true);
  };

  const handleUpdateExpense = async () => {
    if (!editingExpense || !description.trim() || !amount.trim()) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    const expenseAmount = parseFloat(amount);
    if (isNaN(expenseAmount) || expenseAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    try {
      setLoading(true);
      
      const updatedExpense = {
        ...editingExpense,
        description: description.trim(),
        amount: expenseAmount,
        category,
      };

      await updateExpense(editingExpense._id, updatedExpense);
      
      // Clear form and close modal
      setDescription('');
      setAmount('');
      setEditingExpense(null);
      setShowEditModal(false);
      Alert.alert('Success', 'Expense updated successfully!');
    } catch (error: any) {
      console.error('Update expense error:', error);
      Alert.alert('Error', error.message || 'Failed to update expense');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExpense = (expense: Expense) => {
    Alert.alert(
      'Delete Expense',
      `Are you sure you want to delete "${expense.description}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await deleteExpense(expense._id);
              Alert.alert('Success', 'Expense deleted successfully!');
            } catch (error: any) {
              console.error('Delete expense error:', error);
              Alert.alert('Error', error.message || 'Failed to delete expense');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const totalSplitBills = splitBills.reduce((sum, bill) => {
    const userShare = bill.participants.find((p: { userId: string; amount: number }) => p.userId === currentUser?._id);
    return sum + (userShare?.amount || 0);
  }, 0);

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#10B981', '#059669']} style={styles.header}>
        <Text style={styles.headerTitle}>Expenses</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Personal</Text>
            <Text style={styles.statValue}>${totalExpenses.toFixed(2)}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Split Bills</Text>
            <Text style={styles.statValue}>${totalSplitBills.toFixed(2)}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.viewModeContainer}>
          <Text style={styles.sectionTitle}>Recent Expenses</Text>
          <View style={styles.viewModeButtons}>
            <TouchableOpacity
              style={[styles.viewModeButton, viewMode === 'category' && styles.viewModeButtonActive]}
              onPress={() => setViewMode('category')}
            >
              <Text style={[styles.viewModeText, viewMode === 'category' && styles.viewModeTextActive]}>
                By Category
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.viewModeButton, viewMode === 'list' && styles.viewModeButtonActive]}
              onPress={() => setViewMode('list')}
            >
              <Text style={[styles.viewModeText, viewMode === 'list' && styles.viewModeTextActive]}>
                All
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {expenses.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={64} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No expenses yet</Text>
            <Text style={styles.emptySubtitle}>Add your first expense to get started</Text>
          </View>
        ) : viewMode === 'category' ? (
          expensesByCategory.map((section) => (
            <View key={section.title} style={styles.categorySection}>
              <View style={styles.categoryHeader}>
                <View style={styles.categoryHeaderLeft}>
                  <Text style={styles.categoryEmoji}>
                    {categoryIcons[section.title as keyof typeof categoryIcons]}
                  </Text>
                  <Text style={styles.categoryTitle}>{section.title}</Text>
                </View>
                <Text style={styles.categoryTotal}>${section.total.toFixed(2)}</Text>
              </View>
              {section.data.map((expense) => (
                <View key={expense._id} style={styles.expenseCard}>
                  <View style={styles.expenseHeader}>
                    <View style={styles.expenseDetails}>
                      <Text style={styles.expenseDescription}>{expense.description}</Text>
                      <Text style={styles.expenseDate}>
                        {new Date(expense.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                    <View style={styles.expenseRight}>
                      <Text style={styles.expenseAmount}>${expense.amount.toFixed(2)}</Text>
                      <View style={styles.expenseActions}>
                        <TouchableOpacity 
                          style={styles.actionButton}
                          onPress={() => handleEditExpense(expense)}
                        >
                          <Ionicons name="pencil" size={16} color="#6B7280" />
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={styles.actionButton}
                          onPress={() => handleDeleteExpense(expense)}
                        >
                          <Ionicons name="trash" size={16} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ))
        ) : (
          expenses
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .map((expense) => (
              <View key={expense._id} style={styles.expenseCard}>
                <View style={styles.expenseHeader}>
                  <View style={styles.expenseIcon}>
                    <Text style={styles.categoryEmoji}>
                      {categoryIcons[expense.category as keyof typeof categoryIcons]}
                    </Text>
                  </View>
                  <View style={styles.expenseDetails}>
                    <Text style={styles.expenseDescription}>{expense.description}</Text>
                    <Text style={styles.expenseCategory}>{expense.category}</Text>
                    <Text style={styles.expenseDate}>
                      {new Date(expense.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.expenseRight}>
                    <Text style={styles.expenseAmount}>${expense.amount.toFixed(2)}</Text>
                    <View style={styles.expenseActions}>
                      <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={() => handleEditExpense(expense)}
                      >
                        <Ionicons name="pencil" size={16} color="#6B7280" />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={() => handleDeleteExpense(expense)}
                      >
                        <Ionicons name="trash" size={16} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            ))
        )}

        {selectedGroup && (
        <>
          <Text style={styles.sectionTitle}>Group Stats</Text>
          <GroupExpenseStats groupId={selectedGroup._id} />
        </>
      )}

      <Text style={styles.sectionTitle}>Split Bills</Text>
        
      {splitBills.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="people-outline" size={64} color="#94A3B8" />
          <Text style={styles.emptyTitle}>No split bills yet</Text>
          <Text style={styles.emptySubtitle}>Create split bill to track group expenses</Text>
        </View>
      ) : (
        splitBills.map((bill) => (
          <SplitBillCard
            key={bill._id}
            bill={bill}
            currentUserId={currentUser?._id}
            onMarkAsPaid={() => handleMarkAsPaid(bill._id)}
          />
        ))
      )}
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowAddModal(true)}
      >
        <LinearGradient colors={['#2563EB', '#3B82F6']} style={styles.fabGradient}>
          <Ionicons name="add" size={28} color="white" />
        </LinearGradient>
      </TouchableOpacity>

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
            <Text style={styles.modalTitle}>Add Expense</Text>
            <TouchableOpacity onPress={handleAddExpense}>
              <Text style={styles.modalSave}>Save</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={styles.textInput}
                value={description}
                onChangeText={setDescription}
                placeholder="Enter expense description"
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Amount</Text>
              <TextInput
                style={styles.textInput}
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
              />
            </View>

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
          </View>
        </SafeAreaView>
      </Modal>

      {/* Edit Expense Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => {
              setShowEditModal(false);
              setEditingExpense(null);
              setDescription('');
              setAmount('');
            }}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Expense</Text>
            <TouchableOpacity onPress={handleUpdateExpense} disabled={loading}>
              <Text style={[styles.modalSave, loading && styles.disabledText]}>
                {loading ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description</Text>
                <TextInput
                  style={styles.input}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Enter expense description"
                  autoCapitalize="sentences"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Amount</Text>
                <TextInput
                  style={styles.input}
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                  {categories.map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.categoryButton,
                        category === cat && styles.categoryButtonActive,
                      ]}
                      onPress={() => setCategory(cat)}
                    >
                      <Text style={styles.categoryButtonEmoji}>
                        {categoryIcons[cat as keyof typeof categoryIcons]}
                      </Text>
                      <Text
                        style={[
                          styles.categoryButtonText,
                          category === cat && styles.categoryButtonTextActive,
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 16,
    borderRadius: 12,
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginBottom: 4,
  },
  statValue: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
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
  emptyState: {
    alignItems: 'center',
    padding: 40,
    marginBottom: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 8,
    textAlign: 'center',
  },
  expenseCard: {
    backgroundColor: 'white',
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
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryEmoji: {
    fontSize: 20,
  },
  expenseDetails: {
    flex: 1,
  },
  expenseDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  expenseCategory: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 2,
  },
  expenseDate: {
    fontSize: 12,
    color: '#94A3B8',
  },
  expenseAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#EF4444',
  },
  billCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#8B5CF6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  billHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  billIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  billDetails: {
    flex: 1,
  },
  billDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  billParticipants: {
    fontSize: 14,
    color: '#8B5CF6',
    marginBottom: 2,
  },
  billDate: {
    fontSize: 12,
    color: '#94A3B8',
  },
  billAmounts: {
    alignItems: 'flex-end',
  },
  billTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  billSplit: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '600',
  },
  billPaid: {
    color: '#10B981',
  },
  billStatus: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 2,
  },
  markAsPaidButton: {
    backgroundColor: '#8B5CF6',
    padding: 6,
    borderRadius: 12,
    marginTop: 4,
  },
  markAsPaidText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
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
    color: '#2563EB',
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
  textInput: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    color: '#1E293B',
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
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
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
  viewModeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewModeButtons: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 2,
  },
  viewModeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  viewModeButtonActive: {
    backgroundColor: '#2563EB',
  },
  viewModeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  viewModeTextActive: {
    color: 'white',
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
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    marginBottom: 8,
  },
  categoryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginLeft: 8,
  },
  categoryTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#059669',
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
  disabledText: {
    color: '#94A3B8',
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    color: '#1E293B',
  },
  categoryButton: {
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
  categoryButtonActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  categoryButtonEmoji: {
    fontSize: 18,
    marginRight: 8,
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  categoryButtonTextActive: {
    color: 'white',
  },
});