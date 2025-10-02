import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { useFinanceStore } from '../../lib/store/financeStore';
import SplitBillCard from './SplitBillCard';
import SettlementHeader from './SettlementHeader';
import SettlementTabs from './SettlementTabs';
import SettlementEmptyState from './SettlementEmptyState';
import { useTheme } from '../context/ThemeContext';

export default function SettlementTracker() {
  const [activeTab, setActiveTab] = useState<'awaiting' | 'settled'>('awaiting');
  const { splitBills, currentUser, markSplitBillAsPaid, rejectSplitBill } = useFinanceStore();
  const { theme } = useTheme();

  // Filter bills based on settlement status
    const filteredBills = useMemo(() => {
    if (!Array.isArray(splitBills) || !currentUser) return [];

    return splitBills.filter(bill => {
      if (!bill || !bill.participants) return false;

      const userParticipant = bill.participants.find(p => {
        const userId = typeof p.userId === 'string' ? p.userId : (p.userId as any)?._id;
        return userId === currentUser._id;
      });
      if (!userParticipant) return false;

      if (activeTab === 'awaiting') {
        return !userParticipant.isPaid;
      } else {
        return userParticipant.isPaid;
      }
    });
  }, [splitBills, currentUser, activeTab]);  // Calculate settlement statistics
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

      const userParticipant = bill.participants.find(p => {
        const userId = typeof p.userId === 'string' ? p.userId : (p.userId as any)?._id;
        return userId === currentUser._id;
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

  const handleMarkAsPaid = async (billId: string) => {
    try {
      await markSplitBillAsPaid(billId);
    } catch (error: any) {
      console.error('Error marking bill as paid:', error);
      
      // Provide user-friendly error messages
      let errorMessage = 'Failed to mark payment as paid';
      if (error.message?.includes('not a participant')) {
        errorMessage = 'You are not authorized to mark this payment as paid. Only participants can update payment status.';
      } else if (error.message?.includes('not found')) {
        errorMessage = 'This split bill could not be found. It may have been deleted.';
      } else if (error.message?.includes('already')) {
        errorMessage = 'This payment has already been marked as paid.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Error', errorMessage);
    }
  };

  const handleRejectBill = async (billId: string) => {
    try {
      await rejectSplitBill(billId);
    } catch (error: any) {
      console.error('Error rejecting bill:', error);
      
      // Provide user-friendly error messages
      let errorMessage = 'Failed to reject the bill';
      if (error.message?.includes('not a participant')) {
        errorMessage = 'You are not authorized to reject this bill. Only participants can reject bills.';
      } else if (error.message?.includes('not found')) {
        errorMessage = 'This split bill could not be found. It may have been deleted.';
      } else if (error.message?.includes('already settled')) {
        errorMessage = 'This bill has already been settled and cannot be rejected.';
      } else if (error.message?.includes('your own')) {
        errorMessage = 'You cannot reject a bill that you created.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Error', errorMessage);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <SettlementHeader stats={settlementStats} />
      <SettlementTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        awaitingCount={settlementStats.awaiting}
        settledCount={settlementStats.settled}
      />

      {/* Bills List */}
      <ScrollView style={[styles.content, { backgroundColor: theme.background }]} showsVerticalScrollIndicator={false}>
        {filteredBills.length === 0 ? (
          <SettlementEmptyState activeTab={activeTab} />
        ) : (
          filteredBills.map((bill) => (
            <SplitBillCard
              key={bill._id}
              bill={bill}
              currentUserId={currentUser?._id}
              onMarkAsPaid={activeTab === 'awaiting' ? () => handleMarkAsPaid(bill._id) : undefined}
              onRejectBill={activeTab === 'awaiting' ? () => handleRejectBill(bill._id) : undefined}
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
  },
  content: {
    flex: 1,
    padding: 20,
  },
});