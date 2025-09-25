import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SplitBill, SplitBillParticipant } from '@/lib/store/financeStore';
import { PaymentStatusCard } from './PaymentStatusCard';
import { SettlementModal } from './SettlementModal';
import GooglePayButton from './GooglePayButton';

interface SplitBillCardProps {
  bill: SplitBill;
  currentUserId?: string;
  onMarkAsPaid?: (billId: string) => void;
  groupId?: string;
}

export default function SplitBillCard({ bill, currentUserId, onMarkAsPaid, groupId }: SplitBillCardProps) {
  const [showPaymentStatus, setShowPaymentStatus] = useState(false);
  const [showSettlement, setShowSettlement] = useState(false);
  const userShare = bill.participants.find(p => p.userId === currentUserId);

  const handlePaymentUpdate = () => {
    // Refresh the bill data if needed
    if (onMarkAsPaid) {
      // This could trigger a refresh of the parent component
    }
  };

  return (
    <>
      <View style={styles.billCard}>
        <View style={styles.billHeader}>
          <View style={styles.billIcon}>
            <Ionicons name="people" size={20} color="#8B5CF6" />
          </View>
          <View style={styles.billDetails}>
            <Text style={styles.billDescription}>{bill.description}</Text>
            <Text style={styles.billParticipants}>
              {bill.participants.length} participants • {bill.category}
            </Text>
            <Text style={[
              styles.billStatus,
              userShare?.isPaid ? styles.statusPaid : styles.statusPending
            ]}>
              {userShare?.isPaid ? '✓ Paid' : '• Pending'}
            </Text>
            <Text style={styles.billDate}>
              {new Date(bill.createdAt).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.billAmounts}>
            <Text style={styles.billTotal}>
              ₹{(bill.totalAmount || 0).toFixed(2)}
            </Text>
            <Text style={[
              styles.billShare,
              userShare?.isPaid && styles.sharePaid
            ]}>
              Your share: ₹{(userShare?.amount || 0).toFixed(2)}
            </Text>
            {!userShare?.isPaid && (
              <View style={styles.paymentButtons}>
                {onMarkAsPaid && (
                  <TouchableOpacity
                    style={styles.markAsPaidButton}
                    onPress={() => onMarkAsPaid(bill._id)}
                  >
                    <Text style={styles.markAsPaidText}>Mark as Paid</Text>
                  </TouchableOpacity>
                )}

                <GooglePayButton
                  amount={userShare?.amount || 0}
                  description={`Payment for ${bill.description}`}
                  splitBillId={bill._id}
                  onSuccess={handlePaymentUpdate}
                  buttonText="Pay with GPay"
                  style={styles.googlePayButton}
                />
              </View>
            )}
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowPaymentStatus(true)}
          >
            <Ionicons name="stats-chart" size={16} color="#007AFF" />
            <Text style={styles.actionButtonText}>Payment Status</Text>
          </TouchableOpacity>

          {groupId && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setShowSettlement(true)}
            >
              <Ionicons name="swap-horizontal" size={16} color="#10B981" />
              <Text style={styles.actionButtonText}>Settlement</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {showPaymentStatus && (
        <PaymentStatusCard
          splitBillId={bill._id}
          onPaymentUpdate={handlePaymentUpdate}
        />
      )}

      {groupId && (
        <SettlementModal
          visible={showSettlement}
          groupId={groupId}
          onClose={() => setShowSettlement(false)}
          onSettlementComplete={handlePaymentUpdate}
        />
      )}

    </>
  );
}

const styles = StyleSheet.create({
  billCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#8B5CF6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  billHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  billIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  billDetails: {
    flex: 1,
  },
  billDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  billParticipants: {
    fontSize: 14,
    color: '#8B5CF6',
    marginBottom: 2,
  },
  billStatus: {
    fontSize: 12,
    marginBottom: 2,
  },
  statusPending: {
    color: '#EF4444',
  },
  statusPaid: {
    color: '#10B981',
  },
  billDate: {
    fontSize: 12,
    color: '#94A3B8',
  },
  billAmounts: {
    alignItems: 'flex-end',
  },
  billTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  billShare: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '600',
  },
  sharePaid: {
    color: '#10B981',
  },
  markAsPaidButton: {
    backgroundColor: '#8B5CF6',
    padding: 6,
    borderRadius: 12,
    marginTop: 4,
  },
  markAsPaidText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  paymentButtons: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  googlePayButton: {
    marginTop: 16,
  },
});
