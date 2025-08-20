import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFinanceStore } from '@/lib/store/financeStore';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const { 
    currentUser, 
    expenses, 
    groups, 
    splitBills,
    loadExpenses,
    loadGroups,
    getSplitBills 
  } = useFinanceStore();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      await Promise.all([
        loadExpenses(),
        loadGroups(),
        getSplitBills()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getRecentExpenses = () => {
    return expenses.slice(0, 3);
  };

  const getPendingSplitBills = () => {
    return splitBills.filter(bill => 
      bill.participants.some(p => 
        p.userId === currentUser?._id && !p.isPaid
      )
    ).slice(0, 3);
  };

  const getTotalOwed = () => {
    return getPendingSplitBills().reduce((total, bill) => {
      const userParticipant = bill.participants.find(p => p.userId === currentUser?._id);
      return total + (userParticipant?.amount || 0);
    }, 0);
  };

  const getTotalExpensesThisMonth = () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    return expenses
      .filter(expense => {
        const expenseDate = new Date(expense.createdAt);
        return expenseDate.getMonth() === currentMonth && 
               expenseDate.getFullYear() === currentYear;
      })
      .reduce((total, expense) => total + expense.amount, 0);
  };

  if (!currentUser) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>Please log in to access your dashboard</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <LinearGradient colors={['#2563EB', '#1D4ED8']} style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.greeting}>Good {getTimeOfDay()},</Text>
              <Text style={styles.userName}>{currentUser.name}</Text>
            </View>
            <TouchableOpacity 
              style={styles.profileButton}
              onPress={() => router.push('/(tabs)/profile')}
            >
              <Ionicons name="person-circle" size={40} color="white" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <LinearGradient 
              colors={['#10B981', '#059669']} 
              style={styles.statGradient}
            >
              <Ionicons name="wallet" size={24} color="white" />
              <Text style={styles.statAmount}>
                ${getTotalExpensesThisMonth().toFixed(2)}
              </Text>
              <Text style={styles.statLabel}>This Month</Text>
            </LinearGradient>
          </View>

          <View style={styles.statCard}>
            <LinearGradient 
              colors={['#F59E0B', '#D97706']} 
              style={styles.statGradient}
            >
              <Ionicons name="time" size={24} color="white" />
              <Text style={styles.statAmount}>
                ${getTotalOwed().toFixed(2)}
              </Text>
              <Text style={styles.statLabel}>You Owe</Text>
            </LinearGradient>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/(tabs)/expenses')}
            >
              <View style={styles.actionIcon}>
                <Ionicons name="add" size={24} color="#2563EB" />
              </View>
              <Text style={styles.actionTitle}>Add Expense</Text>
              <Text style={styles.actionSubtitle}>Track new spending</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/(tabs)/chats')}
            >
              <View style={styles.actionIcon}>
                <Ionicons name="people" size={24} color="#10B981" />
              </View>
              <Text style={styles.actionTitle}>Group Chat</Text>
              <Text style={styles.actionSubtitle}>Split bills with friends</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/(tabs)/budget')}
            >
              <View style={styles.actionIcon}>
                <Ionicons name="pie-chart" size={24} color="#F59E0B" />
              </View>
              <Text style={styles.actionTitle}>Budget</Text>
              <Text style={styles.actionSubtitle}>Manage your limits</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/(tabs)/insights')}
            >
              <View style={styles.actionIcon}>
                <Ionicons name="trending-up" size={24} color="#8B5CF6" />
              </View>
              <Text style={styles.actionTitle}>Insights</Text>
              <Text style={styles.actionSubtitle}>View analytics</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Expenses */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Expenses</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/expenses')}>
              <Text style={styles.seeAllButton}>See All</Text>
            </TouchableOpacity>
          </View>
          {getRecentExpenses().length > 0 ? (
            getRecentExpenses().map((expense, index) => (
              <View key={expense._id || index} style={styles.expenseItem}>
                <View style={styles.expenseIcon}>
                  <Ionicons 
                    name={getCategoryIcon(expense.category) as any} 
                    size={20} 
                    color="#6B7280" 
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
                  -${expense.amount.toFixed(2)}
                </Text>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={32} color="#CBD5E1" />
              <Text style={styles.emptyStateText}>No recent expenses</Text>
            </View>
          )}
        </View>

        {/* Pending Split Bills */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Pending Payments</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/chats')}>
              <Text style={styles.seeAllButton}>See All</Text>
            </TouchableOpacity>
          </View>
          {getPendingSplitBills().length > 0 ? (
            getPendingSplitBills().map((bill, index) => {
              const userParticipant = bill.participants.find(p => p.userId === currentUser?._id);
              return (
                <View key={bill._id || index} style={styles.billItem}>
                  <View style={styles.billIcon}>
                    <Ionicons name="people" size={20} color="#F59E0B" />
                  </View>
                  <View style={styles.billDetails}>
                    <Text style={styles.billDescription}>
                      {bill.description}
                    </Text>
                    <Text style={styles.billDate}>
                      Due: {new Date(bill.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={styles.billAmount}>
                    ${userParticipant?.amount.toFixed(2) || '0.00'}
                  </Text>
                </View>
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-circle-outline" size={32} color="#10B981" />
              <Text style={styles.emptyStateText}>All caught up!</Text>
            </View>
          )}
        </View>

        {/* Groups */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Groups</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/chats')}>
              <Text style={styles.seeAllButton}>View All</Text>
            </TouchableOpacity>
          </View>
          {(groups || []).length > 0 ? (
            (groups || []).slice(0, 3).map((group, index) => (
              <TouchableOpacity 
                key={group._id || index} 
                style={styles.groupItem}
                onPress={() => router.push('/(tabs)/chats')}
              >
                <View style={styles.groupIcon}>
                  <Ionicons name="people" size={20} color="#2563EB" />
                </View>
                <View style={styles.groupDetails}>
                  <Text style={styles.groupName}>{group.name}</Text>
                  <Text style={styles.groupMembers}>
                    {group.members.length} members
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={32} color="#CBD5E1" />
              <Text style={styles.emptyStateText}>No groups yet</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  profileButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: -12,
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statGradient: {
    padding: 20,
    alignItems: 'center',
  },
  statAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginVertical: 8,
  },
  statLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
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
    color: '#1E293B',
  },
  seeAllButton: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '600',
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: (width - 52) / 2,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
  expenseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
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
    backgroundColor: '#F3F4F6',
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
    color: '#1E293B',
    marginBottom: 2,
  },
  expenseDate: {
    fontSize: 14,
    color: '#64748B',
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
  billItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  billIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  billDetails: {
    flex: 1,
  },
  billDescription: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1E293B',
    marginBottom: 2,
  },
  billDate: {
    fontSize: 14,
    color: '#64748B',
  },
  billAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F59E0B',
  },
  groupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  groupIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  groupDetails: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1E293B',
    marginBottom: 2,
  },
  groupMembers: {
    fontSize: 14,
    color: '#64748B',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 8,
  },
});