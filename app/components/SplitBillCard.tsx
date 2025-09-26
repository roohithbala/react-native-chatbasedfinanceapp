import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SplitBill, SplitBillParticipant } from '@/lib/store/financeStore';
import { PaymentStatusCard } from './PaymentStatusCard';
import { SettlementModal } from './SettlementModal';
import GooglePayButton from './GooglePayButton';
import { useTheme } from '../context/ThemeContext';

interface SplitBillCardProps {
  bill: SplitBill;
  currentUserId?: string;
  onMarkAsPaid?: (billId: string) => void;
  groupId?: string;
}

export default function SplitBillCard({ bill, currentUserId, onMarkAsPaid, groupId }: SplitBillCardProps) {
  const [showPaymentStatus, setShowPaymentStatus] = useState(false);
  const [showSettlement, setShowSettlement] = useState(false);
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const userShare = bill.participants.find(p => p.userId === currentUserId);

  const handlePaymentUpdate = () => {
    // Refresh the bill data if needed
    if (onMarkAsPaid) {
      // This could trigger a refresh of the parent component
    }
  };

  return (
    <>
      <View style={[styles.billCard, { backgroundColor: theme.surface, borderLeftColor: theme.primary || '#8B5CF6' }]}>
        <View style={styles.billHeader}>
          <View style={[styles.billIcon, { backgroundColor: theme.surfaceSecondary || '#F3E8FF' }]}>
            <Ionicons name="people" size={20} color={theme.primary || "#8B5CF6"} />
          </View>
          <View style={styles.billDetails}>
            <Text style={[styles.billDescription, { color: theme.text }]}>{bill.description}</Text>
            <Text style={[styles.billParticipants, { color: theme.primary || '#8B5CF6' }]}>
              {bill.participants.length} participants • {bill.category}
            </Text>
            <Text style={[
              styles.billStatus,
              userShare?.isPaid ? { color: theme.success || '#10B981' } : { color: theme.error || '#EF4444' }
            ]}>
              {userShare?.isPaid ? '✓ Paid' : '• Pending'}
            </Text>
            <Text style={[styles.billDate, { color: theme.textSecondary || '#94A3B8' }]}>
              {new Date(bill.createdAt).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.billAmounts}>
            <Text style={[styles.billTotal, { color: theme.text }]}>{theme.currency}{(bill.totalAmount || 0).toFixed(2)}</Text>
            <Text style={[
              styles.billShare,
              userShare?.isPaid ? { color: theme.success || '#10B981' } : { color: theme.error || '#EF4444' }
            ]}>
              Your share: {theme.currency}{(userShare?.amount || 0).toFixed(2)}
            </Text>
            {!userShare?.isPaid && (
              <View style={styles.paymentButtons}>
                {onMarkAsPaid && (
                  <TouchableOpacity
                    style={[styles.markAsPaidButton, { backgroundColor: theme.primary || '#8B5CF6' }]}
                    onPress={() => onMarkAsPaid(bill._id)}
                  >
                    <Text style={[styles.markAsPaidText, { color: theme.surface || 'white' }]}>Mark as Paid</Text>
                  </TouchableOpacity>
                )}

                <GooglePayButton
                  amount={userShare?.amount || 0}
                  description={`Payment for ${bill.description}`}
                  splitBillId={bill._id}
                  recipientId={bill.createdBy._id}
                  recipientName={bill.createdBy.name}
                  groupId={groupId}
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
            style={[styles.actionButton, { backgroundColor: theme.surfaceSecondary || '#F8FAFC', borderTopColor: theme.border || '#F1F5F9' }]}
            onPress={() => setShowPaymentStatus(true)}
          >
            <Ionicons name="stats-chart" size={16} color={theme.primary || "#007AFF"} />
            <Text style={[styles.actionButtonText, { color: theme.text }]}>Payment Status</Text>
          </TouchableOpacity>

          {groupId && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.surfaceSecondary || '#F8FAFC' }]}
              onPress={() => setShowSettlement(true)}
            >
              <Ionicons name="swap-horizontal" size={16} color={theme.success || "#10B981"} />
              <Text style={[styles.actionButtonText, { color: theme.text }]}>Settlement</Text>
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

const getStyles = (theme: any) => StyleSheet.create({
  billCard: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: theme.primary,
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
    backgroundColor: theme.surfaceSecondary,
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
    color: theme.text,
    marginBottom: 4,
  },
  billParticipants: {
    fontSize: 14,
    color: theme.primary,
    marginBottom: 2,
  },
  billStatus: {
    fontSize: 12,
    marginBottom: 2,
  },
  statusPending: {
    color: theme.error,
  },
  statusPaid: {
    color: theme.success,
  },
  billDate: {
    fontSize: 12,
    color: theme.textSecondary,
  },
  billAmounts: {
    alignItems: 'flex-end',
  },
  billTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 4,
  },
  billShare: {
    fontSize: 14,
    color: theme.error,
    fontWeight: '600',
  },
  sharePaid: {
    color: theme.success,
  },
  markAsPaidButton: {
    backgroundColor: theme.primary,
    padding: 6,
    borderRadius: 12,
    marginTop: 4,
  },
  markAsPaidText: {
    color: theme.surface,
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
    borderTopColor: theme.border,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surfaceSecondary,
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
    color: theme.text,
  },
  googlePayButton: {
    marginTop: 16,
  },
});
