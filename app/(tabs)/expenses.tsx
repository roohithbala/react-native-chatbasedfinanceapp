import React, { useState, useEffect, useMemo } from 'react';
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
  Platform,
  KeyboardAvoidingView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFinanceStore, Expense } from '@/lib/store/financeStore';
import SplitBillCard from '@/app/components/SplitBillCard';
import GroupExpenseStats from '@/app/components/GroupExpenseStats';
import DateTimePicker from '@react-native-community/datetimepicker';

const { width } = Dimensions.get('window');

export default function ExpensesScreen() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [location, setLocation] = useState('');
  const [tags, setTags] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState('monthly');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'expenses' | 'splitBills'>('expenses');
  const [splitBillTab, setSplitBillTab] = useState<'awaiting' | 'settled'>('awaiting');
  const [viewMode, setViewMode] = useState<'list' | 'category'>('category');
  const {
    expenses: rawExpenses,
    addExpense,
    updateExpense,
    deleteExpense,
    splitBills: rawSplitBills,
    currentUser,
    selectedGroup,
    loadExpenses,
    getGroupSplitBills
  } = useFinanceStore();

  // Ensure expenses and splitBills are always arrays
  const expenses = Array.isArray(rawExpenses) ? rawExpenses : [];
  const splitBills = Array.isArray(rawSplitBills) ? rawSplitBills : [];

  // Load data when component mounts or selected group changes
  useEffect(() => {
    const loadData = async () => {
      try {
        if (currentUser) {
          await loadExpenses();
          if (selectedGroup?._id) {
            await getGroupSplitBills(selectedGroup._id);
          }
        }
      } catch (error) {
        console.error('Error loading expenses data:', error);
      }
    };

    loadData();
  }, [currentUser, selectedGroup?._id, loadExpenses, getGroupSplitBills]);

  // Filter expenses by selected group
  const filteredExpenses = useMemo(() => {
    if (!selectedGroup) return expenses;
    return expenses.filter(expense => expense.groupId === selectedGroup._id);
  }, [expenses, selectedGroup]);

  const categories = [
    'Food', 'Transport', 'Entertainment', 'Shopping', 'Bills',
    'Health', 'Education', 'Travel', 'Utilities', 'Other'
  ];

  const paymentMethods = ['Cash', 'Card', 'Digital Wallet', 'Bank Transfer', 'Other'];
  const recurringOptions = ['daily', 'weekly', 'monthly', 'yearly'];

  // Smart categorization keywords
  const categoryKeywords = {
    Food: ['lunch', 'dinner', 'breakfast', 'coffee', 'tea', 'restaurant', 'food', 'meal', 'snack', 'drink', 'beverage', 'cafe', 'pizza', 'burger', 'sandwich', 'sushi', 'pasta', 'steak', 'chicken', 'fish', 'salad', 'dessert', 'ice cream', 'cake', 'cookie', 'bread', 'milk', 'juice', 'soda', 'beer', 'wine', 'alcohol', 'bar', 'pub', 'groceries', 'supermarket', 'market'],
    Transport: ['taxi', 'uber', 'lyft', 'bus', 'train', 'metro', 'subway', 'flight', 'plane', 'airport', 'gas', 'fuel', 'petrol', 'parking', 'toll', 'car', 'bike', 'scooter', 'ride', 'travel', 'commute'],
    Entertainment: ['movie', 'cinema', 'theater', 'concert', 'music', 'game', 'gaming', 'party', 'event', 'festival', 'club', 'nightclub', 'show', 'performance', 'ticket', 'amusement', 'park', 'zoo', 'museum', 'art', 'gallery'],
    Shopping: ['clothes', 'clothing', 'shirt', 'pants', 'shoes', 'bag', 'accessories', 'jewelry', 'watch', 'electronics', 'phone', 'laptop', 'computer', 'tablet', 'book', 'gift', 'present', 'shopping', 'store', 'mall', 'amazon', 'ebay'],
    Bills: ['electricity', 'water', 'internet', 'phone', 'mobile', 'rent', 'mortgage', 'insurance', 'subscription', 'netflix', 'spotify', 'amazon prime', 'utility', 'bill', 'payment', 'fee'],
    Health: ['doctor', 'hospital', 'clinic', 'medicine', 'pharmacy', 'drug', 'medical', 'dental', 'dentist', 'therapy', 'gym', 'fitness', 'health', 'wellness', 'supplement', 'vitamin'],
    Education: ['school', 'college', 'university', 'course', 'class', 'book', 'tuition', 'exam', 'test', 'study', 'learning', 'education', 'training', 'workshop', 'seminar'],
    Travel: ['hotel', 'resort', 'vacation', 'trip', 'tour', 'holiday', 'accommodation', 'lodging', 'booking', 'reservation', 'travel', 'journey', 'destination'],
    Utilities: ['electric', 'gas', 'water', 'internet', 'cable', 'phone', 'utility', 'maintenance', 'repair', 'service', 'cleaning']
  };

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

  // Smart categorization function
  const suggestCategory = (description: string): string => {
    if (!description) return 'Food'; // Default category

    const lowerDescription = description.toLowerCase();

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      for (const keyword of keywords) {
        if (lowerDescription.includes(keyword)) {
          return category;
        }
      }
    }

    return 'Food'; // Default to Food if no match found
  };

  // Auto-categorize when description changes
  const handleDescriptionChange = (text: string) => {
    setDescription(text);

    // Only auto-categorize if category is still the default 'Food' or if it's 'Other'
    if (category === 'Food' || category === 'Other') {
      const suggestedCategory = suggestCategory(text);
      if (suggestedCategory !== 'Food') { // Only change if we found a better match
        setCategory(suggestedCategory);
      }
    }
  };

  // Group expenses by category
  const expensesByCategory = useMemo(() => {
    const grouped = filteredExpenses.reduce((acc, expense) => {
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
  }, [filteredExpenses]);

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

  const resetForm = () => {
    setDescription('');
    setAmount('');
    setCategory('Food');
    setLocation('');
    setTags('');
    setPaymentMethod('Cash');
    setIsRecurring(false);
    setRecurringFrequency('monthly');
    setDate(new Date());
    setNotes('');
  };

  const validateForm = () => {
    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return false;
    }

    if (!amount.trim()) {
      Alert.alert('Error', 'Please enter an amount');
      return false;
    }

    const expenseAmount = parseFloat(amount);
    if (isNaN(expenseAmount) || expenseAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount greater than 0');
      return false;
    }

    if (expenseAmount > 1000000) {
      Alert.alert('Error', 'Amount seems too high. Please verify the amount.');
      return false;
    }

    return true;
  };

  const handleAddExpense = async () => {
    if (!validateForm()) return;
    if (!currentUser) {
      Alert.alert('Error', 'Please log in to add expenses');
      return;
    }

    try {
      setLoading(true);

      const expenseAmount = parseFloat(amount);
      const tagArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);

      const newExpense = {
        description: description.trim(),
        amount: expenseAmount,
        category,
        userId: currentUser._id,
        groupId: selectedGroup?._id,
        tags: tagArray,
        location: location.trim() || undefined,
        paymentMethod,
        isRecurring,
        recurringFrequency: isRecurring ? recurringFrequency : undefined,
        date: date.toISOString(),
        notes: notes.trim() || undefined,
      };

      await addExpense(newExpense);

      resetForm();
      setShowAddModal(false);
      Alert.alert('Success', 'Expense added successfully! 🎉');
    } catch (error: any) {
      console.error('Add expense error:', error);
      Alert.alert('Error', error.message || 'Failed to add expense. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setDescription(expense.description);
    setAmount(expense.amount.toString());
    setCategory(expense.category);
    setLocation(expense.location || '');
    setTags((expense.tags || []).join(', '));
    setPaymentMethod('Cash'); // Default, could be stored in expense
    setDate(new Date(expense.createdAt));
    setNotes(''); // Could be stored in expense
    setShowEditModal(true);
  };

  const handleUpdateExpense = async () => {
    if (!editingExpense || !validateForm()) return;

    try {
      setLoading(true);

      const expenseAmount = parseFloat(amount);
      const tagArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);

      const updatedExpense = {
        ...editingExpense,
        description: description.trim(),
        amount: expenseAmount,
        category,
        tags: tagArray,
        location: location.trim() || undefined,
        date: date.toISOString(),
        notes: notes.trim() || undefined,
      };

      await updateExpense(editingExpense._id, updatedExpense);

      resetForm();
      setEditingExpense(null);
      setShowEditModal(false);
      Alert.alert('Success', 'Expense updated successfully! ✅');
    } catch (error: any) {
      console.error('Update expense error:', error);
      Alert.alert('Error', error.message || 'Failed to update expense. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExpense = (expense: Expense) => {
    Alert.alert(
      'Delete Expense',
      `Are you sure you want to delete "${expense.description}"?\n\nAmount: $${expense.amount.toFixed(2)}\nCategory: ${expense.category}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await deleteExpense(expense._id);
              Alert.alert('Success', 'Expense deleted successfully! 🗑️');
            } catch (error: any) {
              console.error('Delete expense error:', error);
              Alert.alert('Error', error.message || 'Failed to delete expense. Please try again.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  // Filter split bills based on settlement status
  const filteredSplitBills = useMemo(() => {
    if (!Array.isArray(splitBills) || !currentUser) return [];

    return splitBills.filter(bill => {
      if (!bill || !bill.participants) return false;

      const userParticipant = bill.participants.find(p => p.userId === currentUser._id);
      if (!userParticipant) return false;

      if (splitBillTab === 'awaiting') {
        return !userParticipant.isPaid;
      } else {
        return userParticipant.isPaid;
      }
    });
  }, [splitBills, currentUser, splitBillTab]);

  // Calculate settlement statistics
  const settlementStats = useMemo(() => {
    if (!Array.isArray(splitBills) || !currentUser) {
      return { awaiting: 0, settled: 0, totalAwaiting: 0, totalSettled: 0 };
    }

    let awaiting = 0;
    let settled = 0;
    let totalAwaiting = 0;
    let totalSettled = 0;

    splitBills.forEach(bill => {
      if (!bill || !bill.participants) return;

      const userParticipant = bill.participants.find(p => p.userId === currentUser._id);
      if (!userParticipant) return;

      if (userParticipant.isPaid) {
        settled++;
        totalSettled += userParticipant.amount;
      } else {
        awaiting++;
        totalAwaiting += userParticipant.amount;
      }
    });

    return { awaiting, settled, totalAwaiting, totalSettled };
  }, [splitBills, currentUser]);

  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const totalSplitBills = splitBills.reduce((sum, bill) => {
    const userShare = bill.participants.find(p => p.userId === currentUser?._id);
    return sum + (userShare?.amount || 0);
  }, 0);

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#10B981', '#059669']} style={styles.header}>
        <Text style={styles.headerTitle}>💰 My Spending</Text>
        
        {/* Main Tab Navigation */}
        <View style={styles.mainTabContainer}>
          <TouchableOpacity
            style={[styles.mainTab, activeTab === 'expenses' && styles.mainTabActive]}
            onPress={() => setActiveTab('expenses')}
          >
            <Ionicons
              name="wallet-outline"
              size={20}
              color={activeTab === 'expenses' ? '#10B981' : '#64748B'}
            />
            <Text style={[styles.mainTabText, activeTab === 'expenses' && styles.mainTabTextActive]}>
              My Expenses
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.mainTab, activeTab === 'splitBills' && styles.mainTabActive]}
            onPress={() => setActiveTab('splitBills')}
          >
            <Ionicons
              name="people-outline"
              size={20}
              color={activeTab === 'splitBills' ? '#8B5CF6' : '#64748B'}
            />
            <Text style={[styles.mainTabText, activeTab === 'splitBills' && styles.mainTabTextActive]}>
              Shared Bills
            </Text>
          </TouchableOpacity>
        </View>

        {/* Dynamic Stats based on active tab */}
        {activeTab === 'expenses' ? (
          <View style={styles.tagsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>This Month</Text>
              <Text style={styles.statValue}>${totalExpenses.toFixed(2)}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Shared Bills</Text>
              <Text style={styles.statValue}>${totalSplitBills.toFixed(2)}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.tagsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>I Owe</Text>
              <Text style={styles.statValue}>{settlementStats.awaiting}</Text>
              <Text style={styles.statSubValue}>${settlementStats.totalAwaiting.toFixed(2)}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>I Paid</Text>
              <Text style={styles.statValue}>{settlementStats.settled}</Text>
              <Text style={styles.statSubValue}>${settlementStats.totalSettled.toFixed(2)}</Text>
            </View>
          </View>
        )}
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'expenses' ? (
          <>
            <View style={styles.viewModeContainer}>
              <Text style={styles.sectionTitle}>Recent Expenses</Text>
              <View style={styles.viewModeButtons}>
                <TouchableOpacity
                  style={[styles.viewModeButton, viewMode === 'category' && styles.viewModeButtonActive]}
                  onPress={() => setViewMode('category')}
                >
                  <Text style={[styles.viewModeText, viewMode === 'category' && styles.viewModeTextActive]}>
                    📊 By Category
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.viewModeButton, viewMode === 'list' && styles.viewModeButtonActive]}
                  onPress={() => setViewMode('list')}
                >
                  <Text style={[styles.viewModeText, viewMode === 'list' && styles.viewModeTextActive]}>
                    📝 All
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {filteredExpenses.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="receipt-outline" size={64} color="#94A3B8" />
                <Text style={styles.emptyTitle}>No expenses yet</Text>
                <Text style={styles.emptySubtitle}>Start tracking your spending by adding your first expense!</Text>
                <TouchableOpacity
                  style={styles.emptyActionButton}
                  onPress={() => setShowAddModal(true)}
                >
                  <Ionicons name="add-circle" size={20} color="white" />
                  <Text style={styles.emptyActionText}>Add First Expense</Text>
                </TouchableOpacity>
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
                      <Text style={styles.categoryCount}>({section.data.length})</Text>
                    </View>
                    <Text style={styles.categoryTotal}>${section.total.toFixed(2)}</Text>
                  </View>
                  {section.data.map((expense) => (
                    <View key={expense._id} style={styles.expenseCard}>
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
                          {expense.tags && expense.tags.length > 0 && (
                            <View style={styles.tagsContainer}>
                              {expense.tags.slice(0, 3).map((tag, index) => (
                                <Text key={index} style={styles.tag}>#{tag}</Text>
                              ))}
                            </View>
                          )}
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
              filteredExpenses
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
                <Text style={styles.sectionTitle}>📊 Group Stats</Text>
                <GroupExpenseStats groupId={selectedGroup._id} />
              </>
            )}
          </>
        ) : (
          <>
            {/* Split Bills Tab */}
            <View style={styles.splitBillTabContainer}>
              <TouchableOpacity
                style={[styles.splitBillTab, splitBillTab === 'awaiting' && styles.splitBillTabActive]}
                onPress={() => setSplitBillTab('awaiting')}
              >
                <Ionicons
                  name="time-outline"
                  size={20}
                  color={splitBillTab === 'awaiting' ? '#EF4444' : '#64748B'}
                />
                <Text style={[styles.splitBillTabText, splitBillTab === 'awaiting' && styles.splitBillTabTextActive]}>
                  Awaiting ({settlementStats.awaiting})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.splitBillTab, splitBillTab === 'settled' && styles.splitBillTabActive]}
                onPress={() => setSplitBillTab('settled')}
              >
                <Ionicons
                  name="checkmark-circle-outline"
                  size={20}
                  color={splitBillTab === 'settled' ? '#10B981' : '#64748B'}
                />
                <Text style={[styles.splitBillTabText, splitBillTab === 'settled' && styles.splitBillTabTextActive]}>
                  Settled ({settlementStats.settled})
                </Text>
              </TouchableOpacity>
            </View>

            {filteredSplitBills.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons
                  name={splitBillTab === 'awaiting' ? 'time-outline' : 'checkmark-circle-outline'}
                  size={64}
                  color="#94A3B8"
                />
                <Text style={styles.emptyTitle}>
                  {splitBillTab === 'awaiting' ? 'No pending payments' : 'No settled bills'}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {splitBillTab === 'awaiting'
                    ? 'All your split bills are settled!'
                    : 'Your settled bills will appear here'
                  }
                </Text>
              </View>
            ) : (
              filteredSplitBills.map((bill) => (
                <SplitBillCard
                  key={bill._id}
                  bill={bill}
                  currentUserId={currentUser?._id}
                  onMarkAsPaid={splitBillTab === 'awaiting' ? () => handleMarkAsPaid(bill._id) : undefined}
                />
              ))
            )}
          </>
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

      {/* Enhanced Add Expense Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'overFullScreen'}
        transparent={false}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => {
                setShowAddModal(false);
                resetForm();
              }}>
                <Text style={styles.modalCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>➕ Add Expense</Text>
              <TouchableOpacity onPress={handleAddExpense} disabled={loading}>
                <Text style={[styles.modalSave, loading && styles.disabledText]}>
                  {loading ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>📝 Description *</Text>
                <TextInput
                  style={styles.textInput}
                  value={description}
                  onChangeText={handleDescriptionChange}
                  placeholder="What did you spend on?"
                  placeholderTextColor="#94A3B8"
                  maxLength={100}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>💰 Amount *</Text>
                <TextInput
                  style={styles.amountInput}
                  value={amount}
                  onChangeText={(text) => {
                    // Allow only numbers and decimal point
                    const cleaned = text.replace(/[^0-9.]/g, '');
                    const parts = cleaned.split('.');
                    if (parts.length > 2) return;
                    if (parts[1] && parts[1].length > 2) return;
                    setAmount(cleaned);
                  }}
                  placeholder="0.00"
                  placeholderTextColor="#94A3B8"
                  keyboardType="decimal-pad"
                  maxLength={10}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>📂 Category</Text>
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
                <Text style={styles.inputLabel}>📍 Location (Optional)</Text>
                <TextInput
                  style={styles.textInput}
                  value={location}
                  onChangeText={setLocation}
                  placeholder="Where did you make this purchase?"
                  placeholderTextColor="#94A3B8"
                  maxLength={50}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>🏷️ Tags (Optional)</Text>
                <TextInput
                  style={styles.textInput}
                  value={tags}
                  onChangeText={setTags}
                  placeholder="Add tags separated by commas (e.g., lunch, work, urgent)"
                  placeholderTextColor="#94A3B8"
                  maxLength={100}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>💳 Payment Method</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.categoryScroll}
                >
                  {paymentMethods.map((method) => (
                    <TouchableOpacity
                      key={method}
                      style={[
                        styles.methodChip,
                        paymentMethod === method && styles.methodChipActive,
                      ]}
                      onPress={() => setPaymentMethod(method)}
                    >
                      <Text
                        style={[
                          styles.methodText,
                          paymentMethod === method && styles.methodTextActive,
                        ]}
                      >
                        {method}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>📅 Date</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={styles.dateText}>
                    {date.toLocaleDateString()}
                  </Text>
                  <Ionicons name="calendar" size={20} color="#64748B" />
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={date}
                    mode="date"
                    display="default"
                    onChange={onDateChange}
                    maximumDate={new Date()}
                  />
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>🔄 Recurring Expense</Text>
                <TouchableOpacity
                  style={styles.toggleContainer}
                  onPress={() => setIsRecurring(!isRecurring)}
                >
                  <View style={[styles.toggle, isRecurring && styles.toggleActive]}>
                    <View style={[styles.toggleCircle, isRecurring && styles.toggleCircleActive]} />
                  </View>
                  <Text style={styles.toggleText}>
                    {isRecurring ? 'Yes' : 'No'}
                  </Text>
                </TouchableOpacity>
                {isRecurring && (
                  <View style={styles.recurringOptions}>
                    {recurringOptions.map((freq) => (
                      <TouchableOpacity
                        key={freq}
                        style={[
                          styles.freqChip,
                          recurringFrequency === freq && styles.freqChipActive,
                        ]}
                        onPress={() => setRecurringFrequency(freq)}
                      >
                        <Text
                          style={[
                            styles.freqText,
                            recurringFrequency === freq && styles.freqTextActive,
                          ]}
                        >
                          {freq.charAt(0).toUpperCase() + freq.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>📝 Notes (Optional)</Text>
                <TextInput
                  style={[styles.textInput, styles.notesInput]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Any additional notes..."
                  placeholderTextColor="#94A3B8"
                  multiline
                  maxLength={200}
                  numberOfLines={3}
                />
              </View>
            </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Enhanced Edit Expense Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'overFullScreen'}
        transparent={false}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => {
                setShowEditModal(false);
                setEditingExpense(null);
                resetForm();
              }}>
                <Text style={styles.modalCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>✏️ Edit Expense</Text>
              <TouchableOpacity onPress={handleUpdateExpense} disabled={loading}>
                <Text style={[styles.modalSave, loading && styles.disabledText]}>
                  {loading ? 'Updating...' : 'Update'}
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>📝 Description *</Text>
                <TextInput
                  style={styles.textInput}
                  value={description}
                  onChangeText={handleDescriptionChange}
                  placeholder="What did you spend on?"
                  placeholderTextColor="#94A3B8"
                  maxLength={100}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>💰 Amount *</Text>
                <TextInput
                  style={styles.amountInput}
                  value={amount}
                  onChangeText={(text) => {
                    const cleaned = text.replace(/[^0-9.]/g, '');
                    const parts = cleaned.split('.');
                    if (parts.length > 2) return;
                    if (parts[1] && parts[1].length > 2) return;
                    setAmount(cleaned);
                  }}
                  placeholder="0.00"
                  placeholderTextColor="#94A3B8"
                  keyboardType="decimal-pad"
                  maxLength={10}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>📂 Category</Text>
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
                <Text style={styles.inputLabel}>📍 Location (Optional)</Text>
                <TextInput
                  style={styles.textInput}
                  value={location}
                  onChangeText={setLocation}
                  placeholder="Where did you make this purchase?"
                  placeholderTextColor="#94A3B8"
                  maxLength={50}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>🏷️ Tags (Optional)</Text>
                <TextInput
                  style={styles.textInput}
                  value={tags}
                  onChangeText={setTags}
                  placeholder="Add tags separated by commas"
                  placeholderTextColor="#94A3B8"
                  maxLength={100}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>📅 Date</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={styles.dateText}>
                    {date.toLocaleDateString()}
                  </Text>
                  <Ionicons name="calendar" size={20} color="#64748B" />
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={date}
                    mode="date"
                    display="default"
                    onChange={onDateChange}
                    maximumDate={new Date()}
                  />
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>📝 Notes (Optional)</Text>
                <TextInput
                  style={[styles.textInput, styles.notesInput]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Any additional notes..."
                  placeholderTextColor="#94A3B8"
                  multiline
                  maxLength={200}
                  numberOfLines={3}
                />
              </View>
            </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
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
    gap: 12,
    marginBottom: 16,
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
  emptyActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 16,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  emptyActionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
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
  amountInput: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    fontSize: 20,
    fontWeight: 'bold',
    borderWidth: 2,
    borderColor: '#10B981',
    color: '#1E293B',
    textAlign: 'center',
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
  methodChip: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  methodChipActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  methodText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  methodTextActive: {
    color: 'white',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dateText: {
    fontSize: 16,
    color: '#1E293B',
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E2E8F0',
    marginRight: 12,
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: '#10B981',
  },
  toggleCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'white',
    marginLeft: 2,
  },
  toggleCircleActive: {
    marginLeft: 24,
  },
  toggleText: {
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '600',
  },
  recurringOptions: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  freqChip: {
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  freqChipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  freqText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  freqTextActive: {
    color: 'white',
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
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
  categoryCount: {
    fontSize: 14,
    color: '#64748B',
    marginLeft: 4,
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
  expenseMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  expenseLocation: {
    fontSize: 12,
    color: '#64748B',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  tag: {
    fontSize: 11,
    color: '#8B5CF6',
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  disabledText: {
    color: '#94A3B8',
  },
  mainTabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    padding: 2,
    marginBottom: 16,
  },
  mainTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  mainTabActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  mainTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    marginLeft: 8,
  },
  mainTabTextActive: {
    color: 'white',
  },
  statSubValue: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  splitBillTabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 2,
    marginBottom: 16,
  },
  splitBillTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  splitBillTabActive: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  splitBillTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    marginLeft: 8,
  },
  splitBillTabTextActive: {
    color: '#1E293B',
  },
});