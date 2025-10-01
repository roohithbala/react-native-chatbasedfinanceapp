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

export default function YouOweScreen() {
  const { theme } = useTheme();
  const { currentUser, splitBills } = useFinanceStore();
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

      // Get all settlements where current user owes money
      const userSettlements: SettlementPlan[] = [];

      // Check all split bills for settlements involving current user
      for (const bill of splitBills) {
        try {
          let settlementData: SettlementPlan[] = [];

          if (bill.groupId) {
            // Group settlement
            const response = await PaymentsAPI.getGroupSettlement(bill.groupId);
            settlementData = response.settlement || [];
          } else {
            // Direct chat settlement - calculate manually
            const participants = bill.participants || [];
            const currentUserParticipant = participants.find(p => p.userId === currentUser._id);
            const otherParticipant = participants.find(p => p.userId !== currentUser._id);

            if (currentUserParticipant && otherParticipant && !currentUserParticipant.isPaid) {
              settlementData = [{
                fromUserId: currentUser._id,
                toUserId: otherParticipant.userId,
                amount: currentUserParticipant.amount,
                fromUserName: currentUser.name || 'You',
                toUserName: 'Friend' // For direct chats, we don't have the other user's name easily
              }];
            }
          }

          // Filter settlements where current user is the payer (owes money)
          const userOwedSettlements = settlementData.filter(
            (settlement: SettlementPlan) => settlement.fromUserId === currentUser._id
          );

          userSettlements.push(...userOwedSettlements);
        } catch (err) {
          console.error(`Error loading settlements for bill ${bill._id}:`, err);
        }
      }

      setSettlements(userSettlements);
    } catch (err: any) {
      console.error('Error loading settlements:', err);
      setError(err.message || 'Failed to load settlement details');
    } finally {
      setLoading(false);
    }
  };

  const handleSettlePayment = (settlement: SettlementPlan) => {
    Alert.alert(
      'Mark as Paid',
      `This will mark your ${theme.currency}${settlement.amount} payment to ${settlement.toUserName} as completed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark as Paid',
          onPress: () => {
            Alert.alert('Success', 'Payment marked as completed!');
            // In a real app, this would update the settlement status
            // For now, we'll just show a success message
          },
        },
      ]
    );
  };

  const totalOwed = settlements.reduce((total, settlement) => total + settlement.amount, 0);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>You Owe</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading settlement details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>You Owe</Text>
          <View style={styles.placeholder} />
        </View>
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>You Owe</Text>
        <View style={styles.placeholder} />
      </View>

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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
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
