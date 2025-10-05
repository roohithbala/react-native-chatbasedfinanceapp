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
import { router } from 'expo-router';
import { useFinanceStore } from '@/lib/store/financeStore';
import { PaymentsAPI, SettlementPlan } from '@/lib/services/paymentsAPI';
import { useTheme } from '@/app/context/ThemeContext';
import ExpenseScreenHeader from '@/app/components/ExpenseScreenHeader';

export default function YouOweScreen() {
  const { theme } = useTheme();
  const { currentUser, splitBills, markSplitBillAsPaid } = useFinanceStore();
  const styles = getStyles(theme);

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
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <ExpenseScreenHeader title="You Owe" />
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading settlement details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <ExpenseScreenHeader
          title="You Owe"
          showReloadButton={true}
          onReload={loadSettlements}
        />
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>
          <TouchableOpacity style={[styles.retryButton, { backgroundColor: theme.primary }]} onPress={loadSettlements}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ExpenseScreenHeader title="You Owe" />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {settlements.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-circle" size={64} color={theme.success} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>All Settled Up!</Text>
            <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
              You don&apos;t owe any money to anyone right now.
            </Text>
          </View>
        ) : (
          <>
            <View style={[styles.summaryCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.summaryTitle, { color: theme.text }]}>Total Amount Owed</Text>
              <Text style={[styles.summaryAmount, { color: theme.error }]}>{theme.currency}{totalOwed.toFixed(2)}</Text>
              <Text style={[styles.summarySubtitle, { color: theme.textSecondary }]}>
                Across {settlements.length} settlement{settlements.length !== 1 ? 's' : ''}
              </Text>
            </View>

            <Text style={[styles.sectionTitle, { color: theme.text }]}>Settlement Details</Text>

            {settlements.map((settlement, index) => (
              <View key={index} style={[styles.settlementCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={styles.settlementHeader}>
                  <View style={styles.settlementInfo}>
                    <Text style={[styles.settlementTo, { color: theme.text }]}>
                      To: {settlement.toUserName}
                    </Text>
                    <Text style={[styles.settlementAmount, { color: theme.error }]}>
                      {theme.currency}{settlement.amount.toFixed(2)}
                    </Text>
                  </View>
                </View>

                <View style={styles.settlementActions}>
                  <TouchableOpacity
                    style={[styles.settleButton, { backgroundColor: theme.primary }]}
                    onPress={() => handleSettlePayment(settlement)}
                  >
                    <Text style={styles.settleButtonText}>Mark as Paid</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  summaryCard: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
    alignItems: 'center',
  },
  summaryTitle: {
    fontSize: 16,
    marginBottom: 8,
  },
  summaryAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  summarySubtitle: {
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  settlementCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  settlementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  settlementInfo: {
    flex: 1,
  },
  settlementTo: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  settlementAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  settlementActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  settleButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  settleButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});
