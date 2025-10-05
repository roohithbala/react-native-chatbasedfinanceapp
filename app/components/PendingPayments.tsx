import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../context/ThemeContext';

interface SplitBill {
  _id: string;
  description: string;
  createdAt: string | Date;
  participants: Array<{
    userId: string;
    amount: number;
    isPaid: boolean;
  }>;
}

interface PendingPaymentsProps {
  splitBills: SplitBill[];
  currentUserId?: string;
}

export default function PendingPayments({ splitBills, currentUserId }: PendingPaymentsProps) {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Pending Payments</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/chats')}>
          <Text style={styles.seeAllButton}>See All</Text>
        </TouchableOpacity>
      </View>
      {splitBills.length > 0 ? (
        splitBills.map((bill, index) => {
          const userParticipant = bill.participants.find(p => {
            const participantUserId = typeof p.userId === 'string' ? p.userId : (p.userId as any)?._id;
            return participantUserId === currentUserId;
          });
          return (
            <View key={bill._id || index} style={styles.billItem}>
              <View style={styles.billIcon}>
                <Ionicons name="people" size={20} color={theme.warning} />
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
                {theme.currency}{userParticipant?.amount?.toFixed(2) || '0.00'}
              </Text>
            </View>
          );
        })
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="checkmark-circle-outline" size={32} color={theme.success} />
          <Text style={styles.emptyStateText}>All caught up!</Text>
        </View>
      )}
    </View>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
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
    color: theme.text,
  },
  seeAllButton: {
    fontSize: 14,
    color: theme.primary,
    fontWeight: '600',
  },
  billItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
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
    backgroundColor: theme.warning + '20', // 20% opacity
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
    color: theme.text,
    marginBottom: 2,
  },
  billDate: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  billAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.warning,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyStateText: {
    fontSize: 14,
    color: theme.textSecondary,
    marginTop: 8,
  },
});

export { PendingPayments };