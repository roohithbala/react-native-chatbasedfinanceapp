import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import { useAuthStore } from '@/lib/store/authStore';

interface Reminder {
  id: string;
  splitBillId: string;
  type: 'payment_due' | 'settlement_reminder' | 'overdue_payment';
  message: string;
  scheduledFor: string;
  sentAt: string;
  isRead: boolean;
  readAt?: string;
  escalationLevel: number;
  splitBill: {
    description: string;
    totalAmount: number;
    currency: string;
    createdAt: string;
  };
}

const RemindersList: React.FC = () => {
  const { theme } = useTheme();
  const { currentUser } = useAuthStore();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (currentUser) {
      loadReminders();
    }
  }, [currentUser]);

  const loadReminders = async (showLoading = true) => {
    if (!currentUser) return;

    try {
      if (showLoading) setLoading(true);

      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        Alert.alert('Error', 'Authentication required');
        return;
      }

      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/reminders/my-reminders`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load reminders');
      }

      const data = await response.json();
      setReminders(data.reminders || []);
    } catch (error) {
      console.error('Error loading reminders:', error);
      Alert.alert('Error', 'Failed to load reminders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const markAsRead = async (splitBillId: string, reminderId: string) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/reminders/${splitBillId}/reminder/${reminderId}/read`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        // Update local state
        setReminders(prev =>
          prev.map(reminder =>
            reminder.id === reminderId
              ? { ...reminder, isRead: true, readAt: new Date().toISOString() }
              : reminder
          )
        );
      }
    } catch (error) {
      console.error('Error marking reminder as read:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadReminders(false);
  };

  const getReminderIcon = (type: string) => {
    switch (type) {
      case 'payment_due':
        return 'time-outline';
      case 'settlement_reminder':
        return 'calendar-outline';
      case 'overdue_payment':
        return 'warning-outline';
      default:
        return 'notifications-outline';
    }
  };

  const getReminderColor = (type: string) => {
    switch (type) {
      case 'payment_due':
        return theme.primary;
      case 'settlement_reminder':
        return theme.warning;
      case 'overdue_payment':
        return theme.error;
      default:
        return theme.textSecondary;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  const unreadReminders = reminders.filter(r => !r.isRead);
  const readReminders = reminders.filter(r => r.isRead);

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
          Loading reminders...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {reminders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-off-outline" size={48} color={theme.textSecondary} />
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            No reminders yet
          </Text>
          <Text style={[styles.emptySubtext, { color: theme.textTertiary }]}>
            Reminders will appear here when payments are due or settlements need attention
          </Text>
        </View>
      ) : (
        <>
          {unreadReminders.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Unread ({unreadReminders.length})
              </Text>
              {unreadReminders.map((reminder) => (
                <TouchableOpacity
                  key={reminder.id}
                  style={[styles.reminderCard, { backgroundColor: theme.card, borderColor: getReminderColor(reminder.type) }]}
                  onPress={() => markAsRead(reminder.splitBillId, reminder.id)}
                >
                  <View style={styles.reminderHeader}>
                    <View style={styles.reminderIcon}>
                      <Ionicons
                        name={getReminderIcon(reminder.type)}
                        size={20}
                        color={getReminderColor(reminder.type)}
                      />
                    </View>
                    <View style={styles.reminderMeta}>
                      <Text style={[styles.reminderType, { color: getReminderColor(reminder.type) }]}>
                        {reminder.type.replace('_', ' ').toUpperCase()}
                      </Text>
                      <Text style={[styles.reminderTime, { color: theme.textSecondary }]}>
                        {formatDate(reminder.sentAt)}
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.reminderMessage, { color: theme.text }]}>
                    {reminder.message}
                  </Text>

                  <View style={styles.splitBillInfo}>
                    <Text style={[styles.splitBillDescription, { color: theme.textSecondary }]}>
                      {reminder.splitBill.description}
                    </Text>
                    <Text style={[styles.splitBillAmount, { color: theme.primary }]}>
                      ₹{reminder.splitBill.totalAmount.toFixed(2)}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.markReadButton, { backgroundColor: theme.primary }]}
                    onPress={() => markAsRead(reminder.splitBillId, reminder.id)}
                  >
                    <Text style={[styles.markReadText, { color: theme.background }]}>
                      Mark as Read
                    </Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {readReminders.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
                Read ({readReminders.length})
              </Text>
              {readReminders.map((reminder) => (
                <View
                  key={reminder.id}
                  style={[styles.reminderCard, styles.readReminder, { backgroundColor: theme.surface }]}
                >
                  <View style={styles.reminderHeader}>
                    <View style={styles.reminderIcon}>
                      <Ionicons
                        name={getReminderIcon(reminder.type)}
                        size={20}
                        color={theme.textTertiary}
                      />
                    </View>
                    <View style={styles.reminderMeta}>
                      <Text style={[styles.reminderType, styles.readText, { color: theme.textTertiary }]}>
                        {reminder.type.replace('_', ' ').toUpperCase()}
                      </Text>
                      <Text style={[styles.reminderTime, { color: theme.textTertiary }]}>
                        {formatDate(reminder.sentAt)}
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.reminderMessage, styles.readText, { color: theme.textSecondary }]}>
                    {reminder.message}
                  </Text>

                  <View style={styles.splitBillInfo}>
                    <Text style={[styles.splitBillDescription, { color: theme.textTertiary }]}>
                      {reminder.splitBill.description}
                    </Text>
                    <Text style={[styles.splitBillAmount, { color: theme.textTertiary }]}>
                      ₹{reminder.splitBill.totalAmount.toFixed(2)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingText: {
    textAlign: 'center',
    padding: 20,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  reminderCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  readReminder: {
    opacity: 0.7,
  },
  reminderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  reminderIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  reminderMeta: {
    flex: 1,
  },
  reminderType: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  readText: {
    opacity: 0.7,
  },
  reminderTime: {
    fontSize: 12,
    marginTop: 2,
  },
  reminderMessage: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
    marginBottom: 12,
  },
  splitBillInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  splitBillDescription: {
    fontSize: 14,
    flex: 1,
  },
  splitBillAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  markReadButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  markReadText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default RemindersList;