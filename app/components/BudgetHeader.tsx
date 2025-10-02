import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFinanceStore } from '../../lib/store/financeStore';
import { useTheme } from '../context/ThemeContext';

export const BudgetHeader: React.FC = () => {
  const { theme } = useTheme();
  const { currentUser } = useFinanceStore();

  return (
    <LinearGradient colors={[theme.primary, theme.primaryDark]} style={styles.header}>
      <Text style={styles.headerTitle}>Your Budget</Text>
      <Text style={styles.userInfo}>
        {currentUser ? `User: ${currentUser.name}` : 'Guest User'}
      </Text>
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
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  userInfo: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 4,
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

export default BudgetHeader;