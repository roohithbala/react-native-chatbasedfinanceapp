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
  const { currentUser } = useFinanceStore();
  const [settlement, setSettlement] = useState<SettlementPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      `Are you sure you want to settle ₹${payment.amount.toFixed(2)} from ${payment.fromUserName} to ${payment.toUserName}?`,
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
                `Payment of ₹${payment.amount.toFixed(2)} from ${payment.fromUserName} to ${payment.toUserName} has been recorded.`,
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
      <View key={index} style={styles.settlementItem}>
        <View style={styles.settlementInfo}>
          <Text style={styles.settlementText}>
            <Text style={styles.userName}>{payment.fromUserName}</Text>
            {' → '}
            <Text style={styles.userName}>{payment.toUserName}</Text>
          </Text>
          <Text style={styles.amountText}>₹{(payment.amount || 0).toFixed(2)}</Text>
        </View>

        {(isCurrentUserFrom || isCurrentUserTo) && (
          <TouchableOpacity
            style={[
              styles.settleButton,
              isCurrentUserFrom ? styles.settleButtonOutgoing : styles.settleButtonIncoming,
            ]}
            onPress={() => handleSettlePayment(payment)}
          >
            <Text style={styles.settleButtonText}>
              {isCurrentUserFrom ? 'Pay' : 'Receive'}
            </Text>
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
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Group Settlement</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" />
            <Text style={styles.loadingText}>Calculating optimal settlement...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadSettlement}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : settlement.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No settlements needed!</Text>
            <Text style={styles.emptySubtext}>All debts are settled.</Text>
          </View>
        ) : (
          <ScrollView style={styles.content}>
            <Text style={styles.description}>
              Here are the optimal payments to settle all debts in the group:
            </Text>

            <View style={styles.settlementList}>
              {settlement.map((payment, index) => renderSettlementItem(payment, index))}
            </View>

            <View style={styles.summaryContainer}>
              <Text style={styles.summaryText}>
                Total transactions: {settlement.length}
              </Text>
              <Text style={styles.summaryText}>
                Total amount: ₹{settlement.reduce((sum, payment) => sum + (payment.amount || 0), 0).toFixed(2)}
              </Text>
            </View>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#64748B',
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748B',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
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
    color: '#10B981',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  description: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 20,
    lineHeight: 24,
  },
  settlementList: {
    marginBottom: 20,
  },
  settlementItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settlementInfo: {
    flex: 1,
  },
  settlementText: {
    fontSize: 16,
    marginBottom: 4,
  },
  userName: {
    fontWeight: 'bold',
    color: '#1E293B',
  },
  amountText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2563EB',
  },
  settleButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  settleButtonOutgoing: {
    backgroundColor: '#EF4444',
  },
  settleButtonIncoming: {
    backgroundColor: '#10B981',
  },
  settleButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  summaryContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  summaryText: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 4,
  },
});

export default SettlementModal;