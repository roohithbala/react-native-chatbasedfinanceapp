import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFinanceStore } from '@/lib/store/financeStore';
import { useTheme } from '../context/ThemeContext';
import HomeHeader from '../components/HomeHeader';
import HomeQuickStats from '../components/HomeQuickStats';
import QuickActions from '../components/QuickActions';
import RecentExpenses from '../components/RecentExpenses';
import PendingPayments from '../components/PendingPayments';
import GroupsList from '../components/GroupsList';

export default function HomeScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const { 
    currentUser, 
    expenses, 
    groups, 
    splitBills,
    loadExpenses,
    loadGroups,
    getSplitBills,
    isAuthenticated,
    isLoading,
    error,
    testConnectivity
  } = useFinanceStore();
  const { theme } = useTheme();
  const styles = getStyles(theme);

  useEffect(() => {
    // Only load data if user is authenticated and we don't have data yet
    // Add a flag to prevent multiple calls
    if (isAuthenticated && currentUser && expenses.length === 0 && groups.length === 0 && !isLoading) {
      loadData().catch(error => {
        console.error('Failed to load initial data:', error);
        // Don't crash the app - just log the error
      });
    }
  }, [isAuthenticated, currentUser, expenses.length, groups.length, isLoading]);

  const loadData = async () => {
    try {
      console.log('Loading dashboard data...');
      // Load data individually to prevent one failure from stopping others
      const promises = [
        loadExpenses().catch(error => {
          console.error('Failed to load expenses:', error);
          return null; // Continue with other loads
        }),
        loadGroups().catch(error => {
          console.error('Failed to load groups:', error);
          return null; // Continue with other loads
        }),
        getSplitBills().catch(error => {
          console.error('Failed to load split bills:', error);
          return null; // Continue with other loads
        })
      ];

      await Promise.all(promises);
      console.log('Dashboard data loading completed (some may have failed)');
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Don't re-throw - we want the app to continue running even if data loading fails
    }
  };

  const handleTestConnectivity = async () => {
    try {
      const result = await testConnectivity();
      Alert.alert(
        result.success ? 'Connection Test Passed' : 'Connection Test Failed',
        result.message
      );
    } catch (error: any) {
      Alert.alert('Test Failed', error.message || 'Unknown error occurred');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadData();
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const getRecentExpenses = () => {
    // Filter out expenses that are from settled split bills
    const unsettledSplitBillIds = new Set(
      splitBills
        .filter(bill => !bill.isSettled)
        .map(bill => bill._id)
    );

    return expenses
      .filter(expense => {
        // If expense is not related to a split bill, include it
        if (!expense.groupId) return true;
        
        // If expense is related to a split bill, only include if the bill is not settled
        // For now, we'll include all expenses since we don't have a direct link
        // In a real app, you'd have a field linking expenses to split bills
        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3);
  };

  const getPendingSplitBills = () => {
    return splitBills.filter(bill => 
      bill.participants.some(p => {
        const userId = typeof p.userId === 'string' ? p.userId : (p.userId as any)?._id;
        return userId === currentUser?._id && !p.isPaid;
      })
    ).slice(0, 3);
  };

  const getTotalOwed = () => {
    if (!currentUser || !splitBills) return 0;
    
    return splitBills
      .filter(bill => 
        bill.participants && bill.participants.some(p => {
          const userId = typeof p.userId === 'string' ? p.userId : (p.userId as any)?._id;
          return userId === currentUser._id && !p.isPaid;
        })
      )
      .reduce((total, bill) => {
        const userParticipant = bill.participants.find(p => {
          const userId = typeof p.userId === 'string' ? p.userId : (p.userId as any)?._id;
          return userId === currentUser._id;
        });
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <HomeHeader
          userName={currentUser?.name || 'User'}
          onTestConnectivity={handleTestConnectivity}
        />

        {/* Quick Stats */}
        <HomeQuickStats
          totalExpensesThisMonth={getTotalExpensesThisMonth()}
          totalOwed={getTotalOwed()}
        />

        {/* Quick Actions */}
        <QuickActions />

        {/* Recent Expenses */}
        <RecentExpenses expenses={getRecentExpenses()} />

        {/* Pending Split Bills */}
        <PendingPayments
          splitBills={getPendingSplitBills()}
          currentUserId={currentUser?._id}
        />

        {/* Groups */}
        <GroupsList groups={groups} />
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

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: theme.error,
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: theme.textSecondary,
    marginTop: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: theme.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: theme.surface,
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
});