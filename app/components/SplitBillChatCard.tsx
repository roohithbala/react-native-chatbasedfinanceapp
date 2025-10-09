import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useFinanceStore } from '@/lib/store/financeStore';
import UpiPaymentModal from './UpiPaymentModal';

interface SplitBillChatCardProps {
  splitBill: {
    _id: string;
    description: string;
    totalAmount: number;
    participants: {
      userId: string;
      amount: number;
      isPaid: boolean;
      isRejected?: boolean;
    }[];
    createdBy: {
      _id: string;
      name: string;
    };
  };
  currentUserId: string;
  onPaymentSuccess?: () => void;
  onRejectSuccess?: () => void;
}

const SplitBillChatCard: React.FC<SplitBillChatCardProps> = ({
  splitBill,
  currentUserId,
  onPaymentSuccess,
  onRejectSuccess,
}) => {
  const { theme } = useTheme();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showUpiModal, setShowUpiModal] = useState(false);
  const { markSplitBillAsPaid, rejectSplitBill, currentUser } = useFinanceStore();

  // Find current user's participation
  const currentUserParticipant = splitBill.participants?.find(
    p => {
      const participantId = typeof p.userId === 'object' ? (p.userId as any)._id : p.userId;
      return participantId === currentUserId;
    }
  );

  const isCreator = splitBill.createdBy?._id === currentUserId;
  const hasPaid = currentUserParticipant?.isPaid || false;
  const hasRejected = currentUserParticipant?.isRejected || false;
  const userShare = currentUserParticipant?.amount ?? 0;
  
  // Track split bill changes for debugging
  React.useEffect(() => {
    console.log('🔄 SplitBillChatCard: splitBill prop changed:', {
      splitBillId: splitBill._id,
      currentUserId,
      hasPaid,
      hasRejected,
      userShare,
      participantCount: splitBill.participants?.length,
      participants: splitBill.participants?.map(p => ({
        userId: typeof p.userId === 'object' ? (p.userId as any)._id : p.userId,
        isPaid: p.isPaid,
        isRejected: p.isRejected || false
      })),
      currentUserParticipant: currentUserParticipant ? {
        isPaid: currentUserParticipant.isPaid,
        isRejected: currentUserParticipant.isRejected,
        amount: currentUserParticipant.amount
      } : null
    });
  }, [splitBill, hasPaid, hasRejected, currentUserId, currentUserParticipant, userShare]);
  
  // Debug logging
  console.log('🎫 SplitBillChatCard render:', {
    splitBillId: splitBill._id,
    currentUserId,
    isCreator,
    hasPaid,
    hasRejected,
    userShare,
    participantData: currentUserParticipant,
    allParticipants: splitBill.participants?.map(p => ({
      userId: typeof p.userId === 'object' ? (p.userId as any)._id : p.userId,
      isPaid: p.isPaid,
      isRejected: p.isRejected,
      amount: p.amount
    }))
  });
  
  // Ensure totalAmount is a valid number
  const totalAmount = splitBill.totalAmount ?? 0;
  
  // Safety check - don't render if data is incomplete
  if (!splitBill._id || !splitBill.description || totalAmount === 0) {
    console.warn('⚠️ Invalid split bill data:', splitBill);
    return null;
  }

  const handlePayNow = () => {
    if (!currentUserParticipant || hasPaid) return;
    
    // Get creator's UPI ID from splitBill data
    const creatorUpiId = (splitBill.createdBy as any)?.upiId || currentUser?.upiId || 'merchant@upi';
    
    if (!creatorUpiId || creatorUpiId === 'merchant@upi') {
      Alert.alert(
        'UPI ID Required',
        'The bill creator needs to add their UPI ID to receive payments. Please contact them.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    // Open UPI payment modal
    setShowUpiModal(true);
  };

  const handlePaymentComplete = async () => {
    setIsProcessing(true);
    let shouldShowError = false;
    let errorMessage = '';
    
    try {
      console.log('💰 Marking split bill as paid:', splitBill._id);
      await markSplitBillAsPaid(splitBill._id);
      console.log('✅ Payment marked successfully');
    } catch (error: any) {
      console.error('❌ Payment marking failed:', error);
      
      // If already paid, just log it - don't show error
      if (error.message?.includes('already marked as paid') || error.message?.includes('Payment already marked')) {
        console.log('ℹ️ Payment already marked in backend, will refresh UI');
      } else {
        shouldShowError = true;
        errorMessage = error.message || 'Failed to mark payment';
      }
    } finally {
      setIsProcessing(false);
      
      // ALWAYS refresh the UI, regardless of success or error
      // This ensures we show the latest state from the backend
      console.log('🔄 Triggering UI refresh after payment attempt');
      onPaymentSuccess?.();
      
      // Show error alert AFTER refresh is triggered
      if (shouldShowError) {
        Alert.alert('Error', errorMessage);
      }
    }
  };

  const handleReject = async () => {
    if (!currentUserParticipant || hasPaid) return;

    Alert.alert(
      'Reject Bill',
      `Are you sure you want to reject "${splitBill.description}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            setIsProcessing(true);
            let shouldShowError = false;
            let errorMessage = '';
            
            try {
              console.log('🚫 Rejecting split bill:', splitBill._id);
              console.log('Current participant before reject:', currentUserParticipant);
              
              await rejectSplitBill(splitBill._id);
              
              console.log('✅ Split bill rejected successfully');
            } catch (error: any) {
              console.error('❌ Rejection failed:', error);
              
              // If already rejected, just log it - don't show error
              if (error.message?.includes('already rejected') || error.message?.includes('Cannot reject')) {
                console.log('ℹ️ Bill already rejected or cannot be rejected, will refresh UI');
              } else {
                shouldShowError = true;
                errorMessage = error.message || 'Failed to reject bill';
              }
            } finally {
              setIsProcessing(false);
              
              // ALWAYS refresh the UI, regardless of success or error
              // This ensures we show the latest state from the backend
              console.log('🔄 Triggering UI refresh after rejection attempt');
              onRejectSuccess?.();
              
              // Show success or error alert AFTER refresh is triggered
              if (shouldShowError) {
                Alert.alert('Error', errorMessage);
              } else {
                Alert.alert('Success', 'Bill rejected successfully');
              }
            }
          },
        },
      ]
    );
  };

  const handleReport = async () => {
    Alert.alert(
      'Report Issue',
      'Please select the type of issue you want to report:',
      [
        {
          text: 'Payment Issue',
          onPress: () => submitReport('Payment Issue')
        },
        {
          text: 'Incorrect Amount',
          onPress: () => submitReport('Incorrect Amount')
        },
        {
          text: 'Bill Description Issue',
          onPress: () => submitReport('Bill Description Issue')
        },
        {
          text: 'Other',
          onPress: () => submitReport('Other')
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const submitReport = async (reason: string) => {
    try {
      // Import the chat API service to report the user
      const { chatAPIService } = await import('@/lib/services/ChatAPIService');
      
      await chatAPIService.reportUser({
        reportedUserId: splitBill.createdBy?._id || 'unknown',
        reportedUsername: splitBill.createdBy?.name || 'Unknown',
        reason: `Split Bill Issue: ${reason}`,
        description: `Issue with split bill "${splitBill.description}" (ID: ${splitBill._id})`
      });

      Alert.alert('Report Submitted', 'Your report has been submitted. Our team will review it.');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit report');
    }
  };

  // Don't show card if user is not involved (neither creator nor participant)
  if (!currentUserParticipant && !isCreator) {
    return null;
  }

  // For creators, show a different view without action buttons
  if (isCreator) {
    return (
      <View style={[styles.container, { backgroundColor: theme.surface }]}>
        <View style={styles.header}>
          <Ionicons name="receipt" size={20} color={theme.primary} />
          <Text style={[styles.title, { color: theme.text }]}>
            Split Bill Created
          </Text>
        </View>

        <View style={styles.content}>
          <Text style={[styles.description, { color: theme.text }]}>
            {splitBill.description}
          </Text>

          <View style={styles.amountContainer}>
            <Text style={[styles.totalAmount, { color: theme.text }]}>
              Total: ₹{totalAmount.toFixed(2)}
            </Text>
            <Text style={[styles.creatorNote, { color: theme.textSecondary }]}>
              You paid this bill - waiting for others to pay their share
            </Text>
          </View>

          <View style={styles.participantsContainer}>
            <Text style={[styles.participantsLabel, { color: theme.textSecondary }]}>
              Participants:
            </Text>
            {splitBill.participants.map((participant, index) => (
              <View key={typeof participant.userId === 'object' ? (participant.userId as any)._id : participant.userId} style={styles.participantRow}>
                <Text style={[styles.participantText, { color: theme.text }]}>
                  Person {index + 1}: ₹{(participant.amount ?? 0).toFixed(2)}
                </Text>
                {participant.isPaid && (
                  <View style={styles.statusBadge}>
                    <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                    <Text style={styles.statusText}>Paid</Text>
                  </View>
                )}
                {participant.isRejected && (
                  <View style={styles.statusBadge}>
                    <Ionicons name="close-circle" size={14} color="#EF4444" />
                    <Text style={styles.statusText}>Rejected</Text>
                  </View>
                )}
                {!participant.isPaid && !participant.isRejected && (
                  <View style={styles.statusBadge}>
                    <Ionicons name="time" size={14} color="#F59E0B" />
                    <Text style={styles.statusText}>Pending</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Creator status */}
        <View style={styles.creatorStatusContainer}>
          <Ionicons name="person" size={16} color={theme.primary} />
          <Text style={[styles.creatorStatusMessage, { color: theme.text }]}>
            You created this split bill
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.surface }]}>
      <View style={styles.header}>
        <Ionicons name="receipt" size={20} color={theme.primary} />
        <Text style={[styles.title, { color: theme.text }]}>
          Split Bill Created
        </Text>
      </View>

      <View style={styles.content}>
        <Text style={[styles.description, { color: theme.text }]}>
          {splitBill.description}
        </Text>

        <View style={styles.amountContainer}>
          <Text style={[styles.totalAmount, { color: theme.text }]}>
            Total: ₹{totalAmount.toFixed(2)}
          </Text>
          <Text style={[styles.userShare, { color: theme.primary }]}>
            Your share: ₹{userShare.toFixed(2)}
          </Text>
        </View>

        <View style={styles.participantsContainer}>
          <Text style={[styles.participantsLabel, { color: theme.textSecondary }]}>
            Participants:
          </Text>
          {splitBill.participants.map((participant, index) => (
            <View key={typeof participant.userId === 'object' ? (participant.userId as any)._id : participant.userId} style={styles.participantRow}>
              <Text style={[styles.participantText, { color: theme.text }]}>
                Person {index + 1}: ₹{(participant.amount ?? 0).toFixed(2)}
              </Text>
              {participant.isPaid && (
                <View style={styles.statusBadge}>
                  <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                  <Text style={styles.statusText}>Paid</Text>
                </View>
              )}
              {participant.isRejected && (
                <View style={styles.statusBadge}>
                  <Ionicons name="close-circle" size={14} color="#EF4444" />
                  <Text style={styles.statusText}>Rejected</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      </View>

      {/* Action buttons */}
      {!hasPaid && !hasRejected && (
        <View>
          {/* Pay Now Button - Full Width */}
          <TouchableOpacity
            style={[styles.payButton, { backgroundColor: '#10B981' }]}
            onPress={handlePayNow}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <>
                <Ionicons name="card" size={20} color="white" />
                <Text style={styles.payButtonText}>
                  Pay ₹{userShare.toFixed(2)} via UPI
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Secondary Actions - Side by Side */}
          <View style={styles.secondaryActionsRow}>
            {!isCreator && (
              <TouchableOpacity
                style={[styles.rejectButton, { borderColor: theme.error }]}
                onPress={handleReject}
                disabled={isProcessing}
              >
                <Ionicons name="close-circle" size={18} color={theme.error} />
                <Text style={[styles.rejectButtonText, { color: theme.error }]}>
                  Reject
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.reportButton, { borderColor: '#F59E0B' }]}
              onPress={handleReport}
              disabled={isProcessing}
            >
              <Ionicons name="flag" size={18} color="#F59E0B" />
              <Text style={[styles.reportButtonText, { color: '#F59E0B' }]}>
                Report Issue
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Status messages */}
      {hasPaid && (
        <View style={styles.statusContainer}>
          <Ionicons name="checkmark-circle" size={16} color="#10B981" />
          <Text style={styles.statusMessage}>You have paid your share</Text>
        </View>
      )}

      {hasRejected && (
        <View style={styles.statusContainer}>
          <Ionicons name="close-circle" size={16} color="#EF4444" />
          <Text style={styles.statusMessage}>You have rejected this bill</Text>
        </View>
      )}

      {/* UPI Payment Modal */}
      <UpiPaymentModal
        visible={showUpiModal}
        amount={userShare}
        description={splitBill.description}
        recipientUpiId={(splitBill.createdBy as any)?.upiId || currentUser?.upiId || 'merchant@upi'}
        recipientName={(splitBill.createdBy as any)?.name || 'Bill Creator'}
        splitBillId={splitBill._id}
        onClose={() => setShowUpiModal(false)}
        onPaymentSuccess={handlePaymentComplete}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  content: {
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  amountContainer: {
    marginBottom: 12,
  },
  totalAmount: {
    fontSize: 14,
    marginBottom: 4,
  },
  userShare: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  participantsContainer: {
    marginBottom: 12,
  },
  participantsLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  participantRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  participantText: {
    fontSize: 14,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    marginLeft: 4,
    color: '#666',
  },
  payButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 10,
  },
  payButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 10,
  },
  secondaryActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1.5,
    marginRight: 8,
  },
  rejectButtonText: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  reportButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  reportButtonText: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  statusMessage: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  creatorNote: {
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 4,
  },
  creatorStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: '#F0F9FF',
    borderRadius: 6,
    marginTop: 8,
  },
  creatorStatusMessage: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
    color: '#0369A1',
  },
});

export default SplitBillChatCard;