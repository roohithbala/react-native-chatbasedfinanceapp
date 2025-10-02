import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { View as ThemedView } from './ThemedComponents';
import { PaymentsAPI, SettlementPlan } from '@/lib/services/paymentsAPI';
import { useFinanceStore } from '../../lib/store/financeStore';
import BhimUpiButton from './BhimUpiButton';
import PaymentModal from './PaymentModal';
import { useTheme } from '../context/ThemeContext';

interface SettlementModalProps {
  visible: boolean;
  groupId: string;
  onClose: () => void;
  onSettlementComplete?: () => void;
}

export const SettlementModal: React.FC<SettlementModalProps> = ({
  visible,
  groupId,
  onClose,
  onSettlementComplete,
}) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const { currentUser } = useFinanceStore();
  const [settlement, setSettlement] = useState<SettlementPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<SettlementPlan | null>(null);

  useEffect(() => {
    if (visible && groupId) {
      loadSettlement();
    }
  }, [visible, groupId]);

  const loadSettlement = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await PaymentsAPI.getGroupSettlement(groupId);
      setSettlement(response.settlement);
    } catch (err: any) {
      console.error('Error loading settlement:', err);
      setError(err.message || 'Failed to load settlement plan');
    } finally {
      setLoading(false);
    }
  };

  const handleSettlePayment = async (payment: SettlementPlan) => {
    Alert.alert(
      'Confirm Settlement',
      `Are you sure you want to settle ${theme.currency}${payment.amount.toFixed(2)} from ${payment.fromUserName} to ${payment.toUserName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              // Here you would typically create a payment record
              // For now, we'll just show a success message
              Alert.alert(
                'Settlement Recorded',
                `Payment of ${theme.currency}${payment.amount.toFixed(2)} from ${payment.fromUserName} to ${payment.toUserName} has been recorded.`,
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      onSettlementComplete?.();
                      onClose();
                    },
                  },
                ]
              );
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to record settlement');
            }
          },
        },
      ]
    );
  };

  const renderSettlementItem = (payment: SettlementPlan, index: number) => {
    const isCurrentUserFrom = payment.fromUserId === currentUser?._id;
    const isCurrentUserTo = payment.toUserId === currentUser?._id;

    return (
      <View key={index} style={[styles.settlementItem, { backgroundColor: theme.surface }]}>
        <View style={styles.settlementInfo}>
          <Text style={styles.settlementText}>
            <Text style={[styles.userName, { color: theme.text }]}>{payment.fromUserName}</Text>
            {' → '}
            <Text style={[styles.userName, { color: theme.text }]}>{payment.toUserName}</Text>
          </Text>
          <Text style={[styles.amountText, { color: theme.primary }]}>{theme.currency}{(payment.amount || 0).toFixed(2)}</Text>
        </View>

        {(isCurrentUserFrom || isCurrentUserTo) && (
          <TouchableOpacity
            style={[styles.payNowButton, { backgroundColor: theme.primary }]}
            onPress={() => {
              setSelectedPayment(payment);
              setPaymentModalVisible(true);
            }}
          >
            <Text style={[styles.payNowButtonText, { color: theme.surface }]}>Pay Now</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
          <Text style={[styles.title, { color: theme.text }]}>Group Settlement</Text>
          <TouchableOpacity style={[styles.closeButton, { backgroundColor: theme.surfaceSecondary }]} onPress={onClose}>
            <Text style={[styles.closeButtonText, { color: theme.textSecondary }]}>✕</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Calculating optimal settlement...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>
            <TouchableOpacity style={[styles.retryButton, { backgroundColor: theme.primary }]} onPress={loadSettlement}>
              <Text style={[styles.retryButtonText, { color: theme.surface }]}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : settlement.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.success }]}>No settlements needed!</Text>
            <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>All debts are settled.</Text>
          </View>
        ) : (
          <ScrollView style={styles.content}>
            <Text style={[styles.description, { color: theme.textSecondary }]}>
              Here are the optimal payments to settle all debts in the group:
            </Text>

            <View style={styles.settlementList}>
              {settlement.map((payment, index) => renderSettlementItem(payment, index))}
            </View>

            <View style={[styles.summaryContainer, { backgroundColor: theme.surface }]}>
              <Text style={[styles.summaryText, { color: theme.textSecondary }]}>
                Total transactions: {settlement.length}
              </Text>
              <Text style={[styles.summaryText, { color: theme.textSecondary }]}>
                Total amount: {theme.currency}{settlement.reduce((sum, payment) => sum + (payment.amount || 0), 0).toFixed(2)}
              </Text>
            </View>
          </ScrollView>
        )}
      </View>

      {/* Payment Modal */}
      {selectedPayment && (
        <PaymentModal
          visible={paymentModalVisible}
          amount={selectedPayment.amount}
          description={`Payment to ${selectedPayment.toUserName}`}
          recipientName={selectedPayment.toUserName}
          recipientId={selectedPayment.toUserId}
          groupId={groupId}
          onSuccess={(result) => {
            Alert.alert(
              'Payment Successful! 🎉',
              `₹${selectedPayment.amount.toFixed(2)} has been sent to ${selectedPayment.toUserName}.`,
              [
                {
                  text: 'OK',
                  onPress: () => {
                    onSettlementComplete?.();
                    setPaymentModalVisible(false);
                    setSelectedPayment(null);
                  },
                },
              ]
            );
          }}
          onError={(error) => {
            Alert.alert('Payment Failed', error);
            setPaymentModalVisible(false);
            setSelectedPayment(null);
          }}
          onClose={() => {
            setPaymentModalVisible(false);
            setSelectedPayment(null);
          }}
        />
      )}
    </Modal>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    backgroundColor: theme.surface,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.text,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.surfaceSecondary,
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.textSecondary,
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
    color: theme.error,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: theme.primary,
  },
  retryButtonText: {
    fontWeight: 'bold',
    fontSize: 16,
    color: theme.surface,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: theme.text,
  },
  emptySubtext: {
    fontSize: 16,
    textAlign: 'center',
    color: theme.textSecondary,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  description: {
    fontSize: 16,
    marginBottom: 20,
    lineHeight: 24,
    color: theme.text,
  },
  settlementList: {
    marginBottom: 20,
  },
  settlementItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    backgroundColor: theme.surface,
  },
  settlementInfo: {
    flex: 1,
  },
  settlementText: {
    fontSize: 16,
    marginBottom: 4,
    color: theme.text,
  },
  userName: {
    fontWeight: 'bold',
    color: theme.text,
  },
  amountText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.primary,
  },
  settleButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  settleButtonOutgoing: {
    backgroundColor: theme.error,
  },
  settleButtonIncoming: {
    backgroundColor: theme.success,
  },
  settleButtonText: {
    fontWeight: 'bold',
    fontSize: 14,
    color: theme.surface,
  },
  summaryContainer: {
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    backgroundColor: theme.surfaceSecondary,
  },
  summaryText: {
    fontSize: 16,
    marginBottom: 4,
    color: theme.text,
  },
  paymentOptions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  cashButton: {
    flex: 1,
  },
  bhimUpiButton: {
    flex: 1,
  },
  payNowButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  payNowButtonText: {
    fontWeight: 'bold',
    fontSize: 14,
    color: theme.surface,
  },
});

export default SettlementModal;