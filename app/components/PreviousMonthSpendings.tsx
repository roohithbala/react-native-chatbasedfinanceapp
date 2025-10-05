import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

interface Expense {
  _id: string;
  amount: number;
  category: string;
  description: string;
  createdAt: string | Date;
  groupId?: string;
}

interface PreviousMonthSpendingsProps {
  expenses: Expense[];
  onMonthChange?: (direction: 'prev' | 'next') => void;
}

const PreviousMonthSpendings: React.FC<PreviousMonthSpendingsProps> = ({
  expenses,
  onMonthChange,
}) => {
  const { theme } = useTheme();

  // Calculate data for previous month
  const getPreviousMonthData = () => {
    if (!expenses || expenses.length === 0) {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      const monthName = new Date(prevMonthYear, prevMonth, 1).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long'
      });

      return {
        monthName,
        totalSpent: 0,
        categoryBreakdown: [],
        dailySpending: [],
        monthOverMonthChange: 0,
        transactionCount: 0,
        averageDaily: 0,
      };
    }

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Get previous month
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    // Filter expenses for previous month
    const prevMonthExpenses = expenses.filter((expense) => {
      const expenseDate = new Date(expense.createdAt);
      return expenseDate.getMonth() === prevMonth &&
             expenseDate.getFullYear() === prevMonthYear;
    });

    // Calculate totals by category
    const categoryTotals = prevMonthExpenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    // Sort categories by spending amount
    const sortedCategories = Object.entries(categoryTotals)
      .sort(([, a], [, b]) => b - a)
      .map(([category, amount]) => ({ category, amount }));

    // Calculate daily spending
    const dailySpending = prevMonthExpenses.reduce((acc, expense) => {
      const date = new Date(expense.createdAt).toDateString();
      acc[date] = (acc[date] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    const sortedDays = Object.entries(dailySpending)
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .map(([date, amount]) => ({
        date: new Date(date),
        amount,
        dayName: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: new Date(date).getDate(),
      }));

    // Calculate month-over-month comparison
    const prevPrevMonth = prevMonth === 0 ? 11 : prevMonth - 1;
    const prevPrevMonthYear = prevMonth === 0 ? prevMonthYear - 1 : prevMonthYear;

    const prevPrevMonthExpenses = expenses.filter((expense) => {
      const expenseDate = new Date(expense.createdAt);
      return expenseDate.getMonth() === prevPrevMonth &&
             expenseDate.getFullYear() === prevPrevMonthYear;
    });

    const prevPrevMonthTotal = prevPrevMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const prevMonthTotal = prevMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0);

    const monthOverMonthChange = prevPrevMonthTotal > 0
      ? ((prevMonthTotal - prevPrevMonthTotal) / prevPrevMonthTotal) * 100
      : 0;

    // Get month name
    const monthName = new Date(prevMonthYear, prevMonth, 1).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    });

    return {
      monthName,
      totalSpent: prevMonthTotal,
      categoryBreakdown: sortedCategories,
      dailySpending: sortedDays,
      monthOverMonthChange,
      transactionCount: prevMonthExpenses.length,
      averageDaily: prevMonthTotal / new Date(prevMonthYear, prevMonth + 1, 0).getDate(),
    };
  };

  const monthData = getPreviousMonthData();

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      Food: 'restaurant',
      Transport: 'car',
      Entertainment: 'game-controller',
      Shopping: 'bag',
      Bills: 'receipt',
      Health: 'medical',
      Other: 'ellipsis-horizontal',
    };
    return icons[category] || 'ellipsis-horizontal';
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Food: '#EF4444',
      Transport: '#3B82F6',
      Entertainment: '#8B5CF6',
      Shopping: '#F59E0B',
      Bills: '#10B981',
      Health: '#EC4899',
      Other: '#6B7280',
    };
    return colors[category] || '#6B7280';
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.card }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="calendar-outline" size={24} color={theme.primary} />
          <Text style={[styles.title, { color: theme.text }]}>
            {monthData.monthName}
          </Text>
        </View>
        {onMonthChange && (
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={[styles.navButton, { backgroundColor: theme.surface }]}
              onPress={() => onMonthChange('prev')}
            >
              <Ionicons name="chevron-back" size={20} color={theme.text} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.navButton, { backgroundColor: theme.surface }]}
              onPress={() => onMonthChange('next')}
            >
              <Ionicons name="chevron-forward" size={20} color={theme.text} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Summary Stats */}
      <View style={styles.summaryContainer}>
        <View style={styles.statCard}>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Total Spent</Text>
          <Text style={[styles.statValue, { color: theme.text }]}>
            {formatCurrency(monthData.totalSpent)}
          </Text>
        </View>

        <View style={styles.statCard}>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Transactions</Text>
          <Text style={[styles.statValue, { color: theme.text }]}>
            {monthData.transactionCount}
          </Text>
        </View>

        <View style={styles.statCard}>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Daily Average</Text>
          <Text style={[styles.statValue, { color: theme.text }]}>
            {formatCurrency(monthData.averageDaily)}
          </Text>
        </View>
      </View>

      {/* Month-over-month change */}
      <View style={styles.changeContainer}>
        <View style={styles.changeIndicator}>
          <Ionicons
            name={monthData.monthOverMonthChange >= 0 ? 'trending-up' : 'trending-down'}
            size={16}
            color={monthData.monthOverMonthChange >= 0 ? '#EF4444' : '#10B981'}
          />
          <Text style={[
            styles.changeText,
            { color: monthData.monthOverMonthChange >= 0 ? '#EF4444' : '#10B981' }
          ]}>
            {monthData.monthOverMonthChange >= 0 ? '+' : ''}
            {monthData.monthOverMonthChange.toFixed(1)}% from previous month
          </Text>
        </View>
      </View>

      {/* Category Breakdown */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Spending by Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          {monthData.categoryBreakdown.map((item, index) => (
            <View key={index} style={[styles.categoryCard, { backgroundColor: theme.surface }]}>
              <View style={[styles.categoryIcon, { backgroundColor: getCategoryColor(item.category) + '20' }]}>
                <Ionicons
                  name={getCategoryIcon(item.category) as any}
                  size={20}
                  color={getCategoryColor(item.category)}
                />
              </View>
              <Text style={[styles.categoryName, { color: theme.text }]}>{item.category}</Text>
              <Text style={[styles.categoryAmount, { color: theme.primary }]}>
                {formatCurrency(item.amount)}
              </Text>
              <Text style={[styles.categoryPercentage, { color: theme.textSecondary }]}>
                {((item.amount / monthData.totalSpent) * 100).toFixed(1)}%
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Daily Spending Trend */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Daily Spending</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dailyScroll}>
          {monthData.dailySpending.map((day, index) => (
            <View key={index} style={[styles.dayCard, { backgroundColor: theme.surface }]}>
              <Text style={[styles.dayName, { color: theme.textSecondary }]}>{day.dayName}</Text>
              <Text style={[styles.dayNumber, { color: theme.text }]}>{day.dayNumber}</Text>
              <Text style={[styles.dayAmount, { color: theme.primary }]}>
                {formatCurrency(day.amount)}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  headerRight: {
    flexDirection: 'row',
  },
  navButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  changeContainer: {
    marginBottom: 20,
  },
  changeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  changeText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  categoryScroll: {
    marginHorizontal: -4,
  },
  categoryCard: {
    width: 100,
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 4,
    borderRadius: 8,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 4,
  },
  categoryAmount: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  categoryPercentage: {
    fontSize: 10,
  },
  dailyScroll: {
    marginHorizontal: -4,
  },
  dayCard: {
    width: 60,
    alignItems: 'center',
    padding: 8,
    marginHorizontal: 4,
    borderRadius: 8,
  },
  dayName: {
    fontSize: 10,
    fontWeight: '500',
    marginBottom: 2,
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  dayAmount: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default PreviousMonthSpendings;