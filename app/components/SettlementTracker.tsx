import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFinanceStore } from '../../lib/store/financeStore';
import SplitBillCard from './SplitBillCard';

export default function SettlementTracker() {
  const [activeTab, setActiveTab] = useState<'awaiting' | 'settled'>('awaiting');
  const { splitBills, currentUser, markSplitBillAsPaid } = useFinanceStore();

  // Filter bills based on settlement status
  const filteredBills = useMemo(() => {
    if (!Array.isArray(splitBills) || !currentUser) return [];

    return splitBills.filter(bill => {
      if (!bill || !bill.participants) return false;

      const userParticipant = bill.participants.find(p => p.userId._id === currentUser._id);
      if (!userParticipant) return false;

      if (activeTab === 'awaiting') {
        return !userParticipant.isPaid;
      } else {
        return userParticipant.isPaid;
      }
    });
  }, [splitBills, currentUser, activeTab]);

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

      const userParticipant = bill.participants.find(p => p.userId._id === currentUser._id);
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

  const handleMarkAsPaid = async (billId: string) => {
    try {
      await markSplitBillAsPaid(billId);
    } catch (error) {
      console.error('Error marking bill as paid:', error);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#8B5CF6', '#7C3AED']} style={styles.header}>
        <Text style={styles.headerTitle}>💰 Settlement Tracker</Text>
        <Text style={styles.headerSubtitle}>Track your split bill payments</Text>

        {/* Settlement Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Awaiting</Text>
            <Text style={styles.statValue}>{settlementStats.awaiting}</Text>
            <Text style={styles.statAmount}>${settlementStats.totalAwaiting.toFixed(2)}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Settled</Text>
            <Text style={styles.statValue}>{settlementStats.settled}</Text>
            <Text style={styles.statAmount}>${settlementStats.totalSettled.toFixed(2)}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'awaiting' && styles.tabActive]}
          onPress={() => setActiveTab('awaiting')}
        >
          <Ionicons
            name="time-outline"
            size={20}
            color={activeTab === 'awaiting' ? '#8B5CF6' : '#64748B'}
          />
          <Text style={[styles.tabText, activeTab === 'awaiting' && styles.tabTextActive]}>
            Awaiting ({settlementStats.awaiting})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'settled' && styles.tabActive]}
          onPress={() => setActiveTab('settled')}
        >
          <Ionicons
            name="checkmark-circle-outline"
            size={20}
            color={activeTab === 'settled' ? '#10B981' : '#64748B'}
          />
          <Text style={[styles.tabText, activeTab === 'settled' && styles.tabTextActive]}>
            Settled ({settlementStats.settled})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Bills List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {filteredBills.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name={activeTab === 'awaiting' ? 'time-outline' : 'checkmark-circle-outline'}
              size={64}
              color="#94A3B8"
            />
            <Text style={styles.emptyTitle}>
              {activeTab === 'awaiting' ? 'No pending payments' : 'No settled bills'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === 'awaiting'
                ? 'All your split bills are settled!'
                : 'Your settled bills will appear here'
              }
            </Text>
          </View>
        ) : (
          filteredBills.map((bill) => (
            <SplitBillCard
              key={bill._id}
              bill={bill}
              currentUserId={currentUser?._id}
              onMarkAsPaid={activeTab === 'awaiting' ? () => handleMarkAsPaid(bill._id) : undefined}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
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
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginBottom: 4,
  },
  statValue: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statAmount: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: -20,
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: '#F8FAFC',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    marginLeft: 8,
  },
  tabTextActive: {
    color: '#1E293B',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 8,
    textAlign: 'center',
  },
});