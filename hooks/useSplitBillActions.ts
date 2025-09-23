import { useState, useMemo } from 'react';
import { Alert } from 'react-native';
import { useFinanceStore } from '@/lib/store/financeStore';

export function useSplitBillActions() {
  const [loading, setLoading] = useState(false);
  const [splitBillTab, setSplitBillTab] = useState<'awaiting' | 'settled'>('awaiting');

  const {
    splitBills: rawSplitBills,
    currentUser,
  } = useFinanceStore();

  const splitBills = Array.isArray(rawSplitBills) ? rawSplitBills : [];

  const handleMarkAsPaid = async (billId: string) => {
    try {
      setLoading(true);
      await useFinanceStore.getState().markSplitBillAsPaid(billId);
      Alert.alert('Success', 'Payment marked as completed');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to mark payment as paid');
    } finally {
      setLoading(false);
    }
  };

  // Filter split bills based on settlement status
  const filteredSplitBills = useMemo(() => {
    if (!Array.isArray(splitBills) || !currentUser) return [];

    return splitBills.filter(bill => {
      if (!bill || !bill.participants) return false;

      const userParticipant = bill.participants.find(p => p.userId === currentUser._id);
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

      const userParticipant = bill.participants.find(p => p.userId === currentUser._id);
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

  const totalSplitBills = splitBills.reduce((sum, bill) => {
    const userShare = bill.participants.find(p => p.userId === currentUser?._id);
    return sum + (userShare?.amount || 0);
  }, 0);

  return {
    loading,
    splitBillTab,
    setSplitBillTab,
    splitBills,
    filteredSplitBills,
    settlementStats,
    totalSplitBills,
    handleMarkAsPaid,
  };
}