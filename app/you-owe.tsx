import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useFinanceStore } from '@/lib/store/financeStore';
import { PaymentsAPI, SettlementPlan } from '@/lib/services/paymentsAPI';
import { useTheme } from '@/app/context/ThemeContext';
import ExpenseScreenHeader from '@/app/components/ExpenseScreenHeader';
import YouOweSummary from '@/app/components/YouOweSummary';
import SettlementCard from '@/app/components/SettlementCard';
import YouOweEmptyState from '@/app/components/YouOweEmptyState';
import YouOweErrorState from '@/app/components/YouOweErrorState';
import YouOweLoadingState from '@/app/components/YouOweLoadingState';
import { youOweStyles } from '@/lib/styles/youOweStyles';

export default function YouOweScreen() {
  const { theme } = useTheme();
  const { currentUser, splitBills, markSplitBillAsPaid } = useFinanceStore();

  const [settlements, setSettlements] = useState<SettlementPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSettlements();
  }, []);

  const loadSettlements = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      setError(null);

      console.log('Loading settlements for user:', currentUser._id);
      console.log('Available split bills:', splitBills.length);

      // Calculate settlements directly from split bills where current user owes money
      const userSettlements: SettlementPlan[] = [];

      for (const bill of splitBills) {
        try {
          console.log(`Checking bill ${bill._id}:`, {
            description: bill.description,
            participantsCount: bill.participants?.length,
            isSettled: bill.isSettled
          });

          // Skip settled bills
          if (bill.isSettled) {
            console.log(`Skipping settled bill ${bill._id}`);
            continue;
          }

          const participants = bill.participants || [];
          
          // Find current user's participant entry
          const currentUserParticipant = participants.find(p => {
            const userId = typeof p.userId === 'object' && p.userId ? (p.userId as any)._id : p.userId;
            console.log('Checking participant:', { userId, currentUserId: currentUser._id, match: userId === currentUser._id });
            return userId === currentUser._id;
          });

          console.log('Current user participant:', currentUserParticipant);

          // If current user is a participant and hasn't paid, they owe money
          if (currentUserParticipant && !currentUserParticipant.isPaid) {
            console.log(`User owes ${currentUserParticipant.amount} for bill ${bill._id}`);
            
            // For group bills, find who should receive the payment (usually the creator)
            // For direct bills, find the other participant
            let recipientName = 'Unknown';
            let recipientId = '';
            
            if (bill.groupId) {
              // Group bill - payment goes to the bill creator
              recipientName = bill.createdBy?.name || 'Group Member';
              recipientId = bill.createdBy?._id || '';
            } else {
              // Direct bill - find the other participant
              const otherParticipant = participants.find(p => {
                const userId = typeof p.userId === 'object' && p.userId ? (p.userId as any)._id : p.userId;
                return userId !== currentUser._id;
              });
              
              if (otherParticipant) {
                const userId = otherParticipant.userId;
                recipientName = typeof userId === 'object' && userId ? (userId as any).name || 'Friend' : 'Friend';
                recipientId = typeof userId === 'object' && userId ? (userId as any)._id : userId as string;
              }
            }

            userSettlements.push({
              fromUserId: currentUser._id,
              toUserId: recipientId,
              amount: currentUserParticipant.amount,
              fromUserName: currentUser.name || 'You',
              toUserName: recipientName,
              billId: bill._id, // Add bill ID for easier lookup
              billDescription: bill.description
            });
          }
        } catch (err) {
          console.error(`Error processing bill ${bill._id}:`, err);
        }
      }

      console.log('Final settlements:', userSettlements.length);
      setSettlements(userSettlements);
    } catch (err: any) {
      console.error('Error loading settlements:', err);
      setError(err.message || 'Failed to load settlement details');
    } finally {
      setLoading(false);
    }
  };

  const handleSettlePayment = async (settlement: SettlementPlan) => {
    try {
      console.log('Handling settlement payment:', settlement);
      
      // Use the billId that's now included in the settlement
      const billId = settlement.billId;
      
      if (!billId) {
        Alert.alert('Error', 'Could not find the related split bill');
        return;
      }

      console.log('Marking bill as paid:', billId);
      await markSplitBillAsPaid(billId);

      Alert.alert('Success', 'Payment marked as completed!');
      
      // Reload settlements to reflect the change
      await loadSettlements();
      
    } catch (error: any) {
      console.error('Error marking payment as paid:', error);
      
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

  const totalOwed = settlements.reduce((total, settlement) => total + settlement.amount, 0);

  if (loading) {
    return (
      <SafeAreaView style={[youOweStyles.container, { backgroundColor: theme.background }]}>
        <ExpenseScreenHeader title="You Owe" />
        <YouOweLoadingState />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[youOweStyles.container, { backgroundColor: theme.background }]}>
        <ExpenseScreenHeader
          title="You Owe"
          showReloadButton={true}
          onReload={loadSettlements}
        />
        <YouOweErrorState error={error} onRetry={loadSettlements} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[youOweStyles.container, { backgroundColor: theme.background }]}>
      <ExpenseScreenHeader title="You Owe" />

      <ScrollView style={youOweStyles.content} showsVerticalScrollIndicator={false}>
        {settlements.length === 0 ? (
          <YouOweEmptyState />
        ) : (
          <>
            <YouOweSummary totalOwed={totalOwed} settlementCount={settlements.length} />

            <Text style={[youOweStyles.sectionTitle, { color: theme.text }]}>Settlement Details</Text>

            {settlements.map((settlement, index) => (
              <SettlementCard
                key={index}
                settlement={settlement}
                onSettlePayment={handleSettlePayment}
              />
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}


