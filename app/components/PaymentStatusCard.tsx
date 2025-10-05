import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { View as ThemedView } from './ThemedComponents';
import { PaymentsAPI, PaymentSummary, Debt } from '@/lib/services/paymentsAPI';
import { useFinanceStore } from '../../lib/store/financeStore';
import { useTheme } from '../context/ThemeContext';

interface PaymentStatusCardProps {
  splitBillId: string;
  onPaymentUpdate?: () => void;
}

export const PaymentStatusCard: React.FC<PaymentStatusCardProps> = ({
  splitBillId,
  onPaymentUpdate,
}) => {
  const { currentUser } = useFinanceStore();
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPaymentSummary();
  }, [splitBillId]);

  const loadPaymentSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Loading payment summary for bill:', splitBillId);
      const response = await PaymentsAPI.getPaymentSummary(splitBillId);
      console.log('Payment summary response:', response);
      
      // Handle nested response structure: { status: 'success', data: { summary, debts, splitBill } }
      if (response && response.data && response.data.summary) {
        setSummary(response.data.summary);
        setDebts(response.data.debts || []);
      } else {
        console.error('Invalid response structure:', response);
        setError('Invalid response from server');
      }
    } catch (err: any) {
      console.error('Error loading payment summary:', err);
      setError(err.message || 'Failed to load payment summary');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async (participantId: string) => {
    try {
      Alert.alert(
        'Confirm Payment',
        'Are you sure you want to mark this participant as paid?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Confirm',
            onPress: async () => {
              try {
                await PaymentsAPI.markParticipantAsPaid(
                  splitBillId,
                  participantId,
                  'cash',
                  'Marked as paid'
                );
                await loadPaymentSummary();
                onPaymentUpdate?.();
              } catch (err: any) {
                Alert.alert('Error', err.message || 'Failed to mark as paid');
              }
            },
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to mark as paid');
    }
  };

  const handleConfirmPayment = async (paymentId: string) => {
    try {
      await PaymentsAPI.confirmPayment(splitBillId, paymentId);
      await loadPaymentSummary();
      onPaymentUpdate?.();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to confirm payment');
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading payment status...</Text>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadPaymentSummary}>
          <Text style={[styles.retryButtonText, { color: theme.text }]}>Retry</Text>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  if (!summary) {
    return (
      <ThemedView style={styles.container}>
        <Text style={styles.noDataText}>No payment data available</Text>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Text style={styles.title}>Payment Status</Text>

      {/* Overall Summary */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Paid</Text>
          <Text style={styles.summaryValue}>{theme.currency}{(summary?.totalPaid || 0).toFixed(2)}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Owed</Text>
          <Text style={styles.summaryValue}>{theme.currency}{(summary?.totalOwed || 0).toFixed(2)}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Balance</Text>
          <Text style={[styles.summaryValue, (summary?.balance || 0) >= 0 ? { color: theme.success || '#4CAF50' } : { color: theme.error || '#F44336' }]}>
            {theme.currency}{(summary?.balance || 0).toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Participant Status */}
      <Text style={styles.sectionTitle}>Participants</Text>
      <ScrollView style={styles.participantsContainer}>
        {summary?.participants?.map((participant, index) => (
          <View key={participant?.userId || `participant-${index}`} style={styles.participantCard}>
            <View style={styles.participantInfo}>
              <Text style={styles.participantName}>{participant?.name || 'Unknown User'}</Text>
              <Text style={styles.participantAmount}>
                Owed: {theme.currency}{(participant?.amountOwed || 0).toFixed(2)}
              </Text>
              <Text style={styles.participantAmount}>
                Paid: {theme.currency}{(participant?.amountPaid || 0).toFixed(2)}
              </Text>
              <Text style={[styles.participantBalance, (participant?.balance || 0) >= 0 ? { color: theme.success || '#4CAF50' } : { color: theme.error || '#F44336' }]}>
                Balance: {theme.currency}{(participant?.balance || 0).toFixed(2)}
              </Text>
            </View>

            <View style={styles.participantActions}>
              {participant?.isPaid ? (
                <View style={[styles.paidBadge, { backgroundColor: theme.success || '#4CAF50' }]}>
                  <Text style={[styles.paidBadgeText, { color: theme.surface || 'white' }]}>Paid</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.payButton, { backgroundColor: theme.primary || '#007AFF' }]}
                  onPress={() => handleMarkAsPaid(participant?.userId)}
                >
                  <Text style={[styles.payButtonText, { color: theme.surface || 'white' }]}>Mark Paid</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )) || []}
      </ScrollView>

      {/* Outstanding Debts */}
      {debts && debts.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Outstanding Debts</Text>
          <ScrollView style={styles.debtsContainer}>
            {debts.map((debt, index) => (
              <View key={index} style={styles.debtCard}>
                <Text style={[styles.debtText, { color: theme.text }]}>{debt?.fromUserName || 'Unknown'} owes {debt?.toUserName || 'Unknown'} {theme.currency}{(debt?.amount || 0).toFixed(2)}</Text>
              </View>
            ))}
          </ScrollView>
        </>
      )}
    </ThemedView>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    margin: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: theme.text,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 8,
    opacity: 0.7,
    color: theme.textSecondary,
  },
  errorText: {
    color: theme.error,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: theme.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: 'center',
  },
  retryButtonText: {
    color: theme.surface,
    fontWeight: 'bold',
  },
  noDataText: {
    textAlign: 'center',
    opacity: 0.7,
    color: theme.textSecondary,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    padding: 12,
    backgroundColor: theme.surfaceSecondary,
    borderRadius: 8,
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 4,
    color: theme.textSecondary,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.text,
  },
  positive: {
    color: theme.success,
  },
  negative: {
    color: theme.error,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 12,
    color: theme.text,
  },
  participantsContainer: {
    maxHeight: 300,
  },
  participantCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    backgroundColor: theme.surfaceSecondary,
    borderRadius: 8,
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: theme.text,
  },
  participantAmount: {
    fontSize: 14,
    opacity: 0.8,
    color: theme.textSecondary,
  },
  participantBalance: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 4,
  },
  participantActions: {
    alignItems: 'center',
  },
  paidBadge: {
    backgroundColor: theme.success,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  paidBadgeText: {
    color: theme.surface,
    fontWeight: 'bold',
    fontSize: 12,
  },
  payButton: {
    backgroundColor: theme.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  payButtonText: {
    color: theme.surface,
    fontWeight: 'bold',
    fontSize: 14,
  },
  debtsContainer: {
    maxHeight: 200,
  },
  debtCard: {
    padding: 12,
    marginBottom: 8,
    backgroundColor: theme.warning ? `${theme.warning}20` : 'rgba(255,193,7,0.1)',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: theme.warning || '#FFC107',
  },
  debtText: {
    fontSize: 14,
    color: theme.text,
  },
});

export default PaymentStatusCard;