import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFinanceStore } from '../../lib/store/financeStore';
import { useTheme, hexToRgba } from '../context/ThemeContext';
import { expensesAPI } from '../../lib/services/api';

export const BudgetHeader: React.FC = () => {
  const { currentUser } = useFinanceStore();
  const { theme } = useTheme();

  const handleResetExpenses = async () => {
    Alert.alert(
      'Archive All Expenses',
      'Are you sure you want to archive all expenses? You can view your spending history later, but they will be hidden from active expense lists.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive',
          style: 'destructive',
          onPress: async () => {
            try {
              await expensesAPI.resetExpenses();
              Alert.alert('Success', 'All expenses have been archived. You can view your spending history in the insights section.');
              // You might want to refresh the expenses data here
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to archive expenses');
            }
          },
        },
      ]
    );
  };

  return (
    <LinearGradient
      colors={[theme.primary, theme.primaryDark]}
      style={styles.header}
    >
      <View style={styles.headerContent}>
        <View style={styles.titleContainer}>
          <Text style={[styles.headerTitle, { color: theme.surface }]}>Your Budget</Text>
          <Text style={[styles.userInfo, { color: theme.surface + 'CC' }]}>
            {currentUser ? `User: ${currentUser.name}` : 'Guest User'}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.resetButton, { backgroundColor: hexToRgba(theme.surface, 0.2) }]}
          onPress={handleResetExpenses}
        >
          <Text style={[styles.resetButtonText, { color: theme.surface }]}>Archive Expenses</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  userInfo: {
    fontSize: 14,
    marginTop: 4,
  },
  resetButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  resetButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default BudgetHeader;