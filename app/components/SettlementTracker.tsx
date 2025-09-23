import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useFinanceStore } from '../../lib/store/financeStore';
import SplitBillCard from './SplitBillCard';
import SettlementHeader from './SettlementHeader';
import SettlementTabs from './SettlementTabs';
import SettlementEmptyState from './SettlementEmptyState';

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
      <SettlementHeader stats={settlementStats} />
      <SettlementTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        awaitingCount={settlementStats.awaiting}
        settledCount={settlementStats.settled}
      />

      {/* Bills List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {filteredBills.length === 0 ? (
          <SettlementEmptyState activeTab={activeTab} />
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
  content: {
    flex: 1,
    padding: 20,
  },
});