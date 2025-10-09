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
import getStyles from '@/lib/styles/homeStyles';
import HomeHeader from '../components/HomeHeader';
import GroupsList from '../components/GroupsList';
import RecentExpenses from '../components/RecentExpenses';
import PendingPayments from '../components/PendingPayments';
import HomeStats from '../components/HomeStats';
import HomeActions from '../components/HomeActions';
import useHomeData from '../hooks/useHomeData';

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
    if (isAuthenticated && currentUser && expenses.length === 0 && groups.length === 0 && !isLoading) {
      loadData().catch(error => {
        console.error('Failed to load initial data:', error);
       
      });
    }
  }, [isAuthenticated, currentUser, expenses.length, groups.length, isLoading]);

  const loadData = async () => {
    try {
      console.log('Loading dashboard data...');
     
      const promises = [
        loadExpenses().catch(error => {
          console.error('Failed to load expenses:', error);
          return null; 
        }),
        loadGroups().catch(error => {
          console.error('Failed to load groups:', error);
          return null; 
        }),
        getSplitBills().catch(error => {
          console.error('Failed to load split bills:', error);
          return null;
        })
      ];

      await Promise.all(promises);
      console.log('Dashboard data loading completed (some may have failed)');
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      
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

  const { recentExpenses, pendingSplitBills, totalOwed, totalExpensesThisMonth } = useHomeData();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <HomeHeader
          userName={currentUser?.name || 'User'}
          onTestConnectivity={handleTestConnectivity}
        />

        <HomeStats totalExpensesThisMonth={totalExpensesThisMonth} totalOwed={totalOwed} />

        {/* Quick Actions */}
        <HomeActions />

        {/* Recent Expenses */}
        <RecentExpenses expenses={recentExpenses} />

        {/* Pending Split Bills */}
        <PendingPayments
          splitBills={pendingSplitBills}
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

