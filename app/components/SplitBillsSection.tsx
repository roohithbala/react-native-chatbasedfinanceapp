import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SplitBillCard from './SplitBillCard';
import { useTheme } from '../context/ThemeContext';

interface SplitBillsSectionProps {
  splitBills: any[];
  currentUser: any;
  splitBillTab: 'awaiting' | 'settled';
  onSplitBillTabChange: (tab: 'awaiting' | 'settled') => void;
  onMarkAsPaid?: (billId: string) => void;
}

export default function SplitBillsSection({
  splitBills,
  currentUser,
  splitBillTab,
  onSplitBillTabChange,
  onMarkAsPaid
}: SplitBillsSectionProps) {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  // Filter split bills based on settlement status
  const filteredSplitBills = useMemo(() => {
    if (!Array.isArray(splitBills) || !currentUser) return [];

    return splitBills.filter(bill => {
      if (!bill || !bill.participants) return false;

      const userParticipant = bill.participants.find((p: any) => {
        // Handle both populated object and string userId formats
        const participantUserId = typeof p.userId === 'object' ? p.userId._id : p.userId;
        return participantUserId === currentUser._id;
      });

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

      const userParticipant = bill.participants.find((p: any) => {
        // Handle both populated object and string userId formats
        const participantUserId = typeof p.userId === 'object' ? p.userId._id : p.userId;
        return participantUserId === currentUser._id;
      });

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

  return (
    <>
      {/* Split Bills Tab Navigation */}
      <View style={styles.splitBillTabContainer}>
        <TouchableOpacity
          style={[styles.splitBillTab, splitBillTab === 'awaiting' && [styles.splitBillTabActive, { backgroundColor: theme.surface }]]}
          onPress={() => onSplitBillTabChange('awaiting')}
        >
          <Ionicons
            name="time-outline"
            size={20}
            color={splitBillTab === 'awaiting' ? (theme.error || '#EF4444') : (theme.textSecondary || '#64748B')}
          />
          <Text style={[styles.splitBillTabText, splitBillTab === 'awaiting' && styles.splitBillTabTextActive]}>
            Awaiting ({settlementStats.awaiting})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.splitBillTab, splitBillTab === 'settled' && [styles.splitBillTabActive, { backgroundColor: theme.surface }]]}
          onPress={() => onSplitBillTabChange('settled')}
        >
          <Ionicons
            name="checkmark-circle-outline"
            size={20}
            color={splitBillTab === 'settled' ? (theme.success || '#10B981') : (theme.textSecondary || '#64748B')}
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
            color={theme.textSecondary || '#94A3B8'}
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
        <ScrollView showsVerticalScrollIndicator={false}>
          {filteredSplitBills.map((bill) => (
            <SplitBillCard
              key={bill._id}
              bill={bill}
              currentUserId={currentUser?._id}
              onMarkAsPaid={splitBillTab === 'awaiting' ? () => onMarkAsPaid?.(bill._id) : undefined}
            />
          ))}
        </ScrollView>
      )}
    </>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  splitBillTabContainer: {
    flexDirection: 'row',
    backgroundColor: theme.surfaceSecondary || '#F8FAFC',
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
    backgroundColor: theme.surface || 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  splitBillTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textSecondary || '#64748B',
    marginLeft: 8,
  },
  splitBillTabTextActive: {
    color: theme.text || '#1E293B',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    marginBottom: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.textSecondary || '#64748B',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.textSecondary || '#94A3B8',
    marginTop: 8,
    textAlign: 'center',
  },
});