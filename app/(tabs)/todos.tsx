import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import TodoList from '../components/TodoList';
import { todosAPI } from '../services/api';
import { useFinanceStore } from '@/lib/store/financeStore';

interface TodoStats {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  overdue: number;
}

export default function TodosScreen() {
  const [stats, setStats] = useState<TodoStats>({
    total: 0,
    completed: 0,
    inProgress: 0,
    pending: 0,
    overdue: 0,
  });
  const [loading, setLoading] = useState(true);
  const { currentUser } = useFinanceStore();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const statsData = await todosAPI.getStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error loading todo stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadStats();
  };

  const StatCard = ({ title, value, icon, color }: {
    title: string;
    value: number;
    icon: string;
    color: string;
  }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statIcon}>
        <Ionicons name={icon as any} size={24} color={color} />
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>My Todos</Text>
          <Text style={styles.headerSubtitle}>
            Stay organized and get things done
          </Text>
        </View>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={handleRefresh}
        >
          <Ionicons name="refresh" size={20} color="#6b7280" />
        </TouchableOpacity>
      </View>

      {/* Stats Overview */}
      <View style={styles.statsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statsScroll}
        >
          <StatCard
            title="Total"
            value={stats.total}
            icon="list"
            color="#6b7280"
          />
          <StatCard
            title="Completed"
            value={stats.completed}
            icon="checkmark-circle"
            color="#22c55e"
          />
          <StatCard
            title="In Progress"
            value={stats.inProgress}
            icon="time"
            color="#3b82f6"
          />
          <StatCard
            title="Pending"
            value={stats.pending}
            icon="ellipse-outline"
            color="#f59e0b"
          />
          <StatCard
            title="Overdue"
            value={stats.overdue}
            icon="alert-circle"
            color="#ef4444"
          />
        </ScrollView>
      </View>

      {/* Todo List */}
      <View style={styles.todoListContainer}>
        <TodoList showAddButton={true} />
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={async () => {
            try {
              const overdueTodos = await todosAPI.getOverdueTodos();
              if (overdueTodos.length === 0) {
                Alert.alert('Great!', 'No overdue todos. Keep it up!');
              } else {
                Alert.alert(
                  'Overdue Todos',
                  `You have ${overdueTodos.length} overdue todo${overdueTodos.length > 1 ? 's' : ''}.`
                );
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to check overdue todos');
            }
          }}
        >
          <Ionicons name="alert-circle" size={20} color="#ef4444" />
          <Text style={styles.quickActionText}>Check Overdue</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={async () => {
            try {
              const dueSoonTodos = await todosAPI.getTodosDueSoon(7);
              if (dueSoonTodos.length === 0) {
                Alert.alert('All Clear', 'No todos due in the next 7 days.');
              } else {
                Alert.alert(
                  'Due Soon',
                  `${dueSoonTodos.length} todo${dueSoonTodos.length > 1 ? 's' : ''} due in the next 7 days.`
                );
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to check todos due soon');
            }
          }}
        >
          <Ionicons name="calendar" size={20} color="#f59e0b" />
          <Text style={styles.quickActionText}>Due Soon</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => {
            // This will be handled by the TodoList component's add button
            // We could also implement a quick add modal here
          }}
        >
          <Ionicons name="add-circle" size={20} color="#22c55e" />
          <Text style={styles.quickActionText}>Quick Add</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  refreshButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  statsContainer: {
    backgroundColor: '#ffffff',
    marginTop: 8,
  },
  statsScroll: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  statCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minWidth: 120,
  },
  statIcon: {
    marginBottom: 8,
  },
  statContent: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
  },
  statTitle: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  todoListContainer: {
    flex: 1,
    marginTop: 8,
  },
  quickActions: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 6,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
});