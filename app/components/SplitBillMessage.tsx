import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Alert, Linking, Vibration } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SplitBillData } from '../types/chat';
import { useTheme } from '../context/ThemeContext';
import SplitBillService from '../../lib/services/splitBillService';

interface SplitBillMessageProps {
  splitBillData: SplitBillData;
  currentUserId: string;
  messageId: string;
  canReject: boolean;
  onPaymentSuccess?: (updatedSplitBill: any, messageId: string) => void;
  onPayBill?: (splitBillId: string) => void;
  onViewDetails?: (splitBillId: string) => void;
}

export default function SplitBillMessage({
  splitBillData,
  currentUserId,
  messageId,
  canReject,
  onPaymentSuccess,
  onPayBill,
  onViewDetails
}: SplitBillMessageProps) {
  const { theme } = useTheme();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(-20)).current;
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const successAnim = React.useRef(new Animated.Value(0)).current;
  const [isProcessingPayment, setIsProcessingPayment] = React.useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = React.useState(false);

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const userParticipant = splitBillData.participants.find(p => {
    // userId is already a string from the backend
    return p.userId === currentUserId;
  });
  const isPaid = userParticipant?.isPaid || false;
  const isRejected = userParticipant?.isRejected || false;
  const userShare = userParticipant?.amount || 0;

  // Derive payment status from props
  const paymentStatus = isRejected ? 'rejected' : (isPaid ? 'paid' : 'pending');

  const handlePayBill = async () => {
    if (onPayBill && splitBillData.splitBillId) {
      onPayBill(splitBillData.splitBillId);
      return;
    }

    // Direct payment handling
    await processPayment();
  };

  const processPayment = async () => {
    if (!splitBillData.splitBillId || isProcessingPayment) return;

    setIsProcessingPayment(true);
    try {
      // Show payment options
      Alert.alert(
        'Choose Payment Method',
        `Pay ₹${userShare.toFixed(2)} for "${splitBillData.description}"`,
        [
          {
            text: 'BHIM UPI',
            onPress: () => initiateUPIPayment(),
          },
          {
            text: 'Mark as Paid',
            onPress: () => markAsPaidManually(),
            style: 'default',
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert('Error', 'Failed to process payment');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const initiateUPIPayment = async () => {
    try {
      // Create UPI payment URL with proper format
      // Using a more complete UPI URL format for better compatibility
      const upiUrl = `tez://pay?pa=merchant@upi&pn=Split Bill Payment&am=${userShare.toFixed(2)}&cu=INR&tn=Payment for ${splitBillData.description}`;

      console.log('Attempting UPI payment with URL:', upiUrl);

      const supported = await Linking.canOpenURL(upiUrl);
      if (supported) {
        await Linking.openURL(upiUrl);
        // After UPI app opens, show a confirmation dialog
        setTimeout(() => {
          Alert.alert(
            'Payment Initiated',
            'Your UPI app has been opened. Please complete the payment there.',
            [
              {
                text: 'Mark as Paid',
                onPress: () => markAsPaidManually(),
                style: 'default',
              },
              {
                text: 'Cancel',
                style: 'cancel',
              },
            ]
          );
        }, 1000);
      } else {
        // Try alternative UPI URL formats
        const alternativeUrls = [
          `paytmmp://pay?pa=merchant@upi&pn=Split Bill Payment&am=${userShare.toFixed(2)}&cu=INR`,
          `phonepe://pay?pa=merchant@upi&pn=Split Bill Payment&am=${userShare.toFixed(2)}&cu=INR`,
          `bhim://pay?pa=merchant@upi&pn=Split Bill Payment&am=${userShare.toFixed(2)}&cu=INR`
        ];

        let opened = false;
        for (const url of alternativeUrls) {
          try {
            const altSupported = await Linking.canOpenURL(url);
            if (altSupported) {
              await Linking.openURL(url);
              opened = true;
              setTimeout(() => {
                Alert.alert(
                  'Payment Initiated',
                  'Your UPI app has been opened. Please complete the payment there.',
                  [
                    {
                      text: 'Mark as Paid',
                      onPress: () => markAsPaidManually(),
                      style: 'default',
                    },
                    {
                      text: 'Cancel',
                      style: 'cancel',
                    },
                  ]
                );
              }, 1000);
              break;
            }
          } catch (error) {
            console.log('Alternative UPI URL failed:', url);
          }
        }

        if (!opened) {
          Alert.alert(
            'UPI Not Available',
            'No UPI app found on this device. You can still mark the payment as completed manually.',
            [
              {
                text: 'Mark as Paid',
                onPress: () => markAsPaidManually(),
                style: 'default',
              },
              {
                text: 'Cancel',
                style: 'cancel',
              },
            ]
          );
        }
      }
    } catch (error) {
      console.error('UPI payment error:', error);
      Alert.alert(
        'UPI Error',
        'Failed to open UPI app. You can mark the payment as completed manually.',
        [
          {
            text: 'Mark as Paid',
            onPress: () => markAsPaidManually(),
            style: 'default',
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    }
  };

  const markAsPaidManually = async () => {
    if (!splitBillData.splitBillId) return;

    try {
      setIsProcessingPayment(true);
      
      // Add haptic feedback
      Vibration.vibrate(100);
      
      // Animate button press
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();

      const result = await SplitBillService.markAsPaid(splitBillData.splitBillId);
      
      Alert.alert('✅ Payment Successful', 'Your payment has been recorded!');
      
      // Call success callback if provided
      if (onPaymentSuccess) {
        onPaymentSuccess(result.splitBill, messageId);
      }
    } catch (error: any) {
      console.error('Mark as paid error:', error);
      
      // Handle "already paid" error more gracefully
      if (error.message && error.message.includes('already marked this payment as paid')) {
        // Payment is already completed
        Alert.alert('ℹ️ Payment Already Completed', 'This payment has already been marked as paid.');
        return;
      }
      
      // Error vibration
      Vibration.vibrate([0, 200, 100, 200]);
      
      Alert.alert('❌ Payment Failed', error.message || 'Failed to mark payment as completed');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleRejectBill = () => {
    Alert.alert(
      'Reject Split Bill',
      'Are you sure you want to reject this split bill? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: () => rejectBill(),
        },
      ]
    );
  };

  const rejectBill = async () => {
    if (!splitBillData.splitBillId) return;

    try {
      setIsProcessingPayment(true);
      const result = await SplitBillService.rejectBill(splitBillData.splitBillId);
      
      Alert.alert('Bill Rejected', 'You have rejected this split bill.');
      
      // Call success callback if provided
      if (onPaymentSuccess) {
        onPaymentSuccess(result.splitBill, messageId);
      }
    } catch (error: any) {
      console.error('Reject bill error:', error);
      Alert.alert('Error', error.message || 'Failed to reject bill');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleViewDetails = () => {
    if (onViewDetails && splitBillData.splitBillId) {
      onViewDetails(splitBillData.splitBillId);
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      {/* Success Animation Overlay */}
      {showSuccessAnimation && (
        <Animated.View 
          style={[
            styles.successOverlay,
            {
              opacity: successAnim,
              transform: [{ scale: successAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.8, 1]
              }) }]
            }
          ]}
        >
          <View style={styles.successContent}>
            <Ionicons name="checkmark-circle" size={48} color="#10B981" />
            <Text style={styles.successText}>Payment Successful!</Text>
          </View>
        </Animated.View>
      )}

      {/* Notification Header */}
      <View style={styles.notificationHeader}>
        <View style={styles.notificationIcon}>
          <Ionicons name="receipt" size={24} color="#10B981" />
        </View>
        <View style={styles.notificationContent}>
          <Text style={styles.notificationTitle}>Split Bill Request</Text>
          <Text style={styles.notificationSubtitle}>
            {splitBillData.participants.length} people • ₹{splitBillData.totalAmount.toFixed(2)}
          </Text>
        </View>
        <View style={styles.notificationBadge}>
          <Text style={styles.notificationBadgeText}>NEW</Text>
        </View>
      </View>

      {/* Bill Details */}
      <View style={styles.billDetails}>
        <Text style={styles.description}>{splitBillData.description}</Text>

        <View style={styles.amountSection}>
          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>Total Amount</Text>
            <Text style={styles.totalAmount}>₹{splitBillData.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
          </View>
          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>Your Share</Text>
            <Text style={[
              styles.userShare, 
              paymentStatus === 'paid' || isPaid ? styles.paidAmount : 
              paymentStatus === 'rejected' ? styles.rejectedAmount : null
            ]}>
              ₹{userShare.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>
        </View>

        {/* Participants Preview */}
        <View style={styles.participantsPreview}>
          <Text style={styles.participantsLabel}>
            Split with {splitBillData.participants.length - 1} other{splitBillData.participants.length - 1 === 1 ? '' : 's'}
          </Text>
          <View style={styles.participantsList}>
            {splitBillData.participants
              .filter(p => p.userId !== currentUserId)
              .slice(0, 3)
              .map((participant, index) => (
                <View key={`${participant.userId}-${index}`} style={styles.participantChip}>
                  <Text style={styles.participantName}>{participant.name}</Text>
                  {participant.isPaid && (
                    <Ionicons name="checkmark-circle" size={12} color="#10B981" />
                  )}
                </View>
              ))}
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsSection}>
        {paymentStatus === 'pending' ? (
          <>
            <TouchableOpacity
              style={[styles.primaryButton, styles.payButton, isProcessingPayment && styles.disabledButton]}
              onPress={handlePayBill}
              disabled={isProcessingPayment}
            >
              <Animated.View style={[{ transform: [{ scale: scaleAnim }] }]}>
                <Ionicons name="card" size={18} color="white" />
                <Text style={styles.payButtonText}>
                  {isProcessingPayment ? 'Processing...' : `Pay ₹${userShare.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                </Text>
              </Animated.View>
            </TouchableOpacity>
            <View style={styles.secondaryButtonsRow}>
              {canReject && (
                <TouchableOpacity
                  style={[styles.secondaryButton, styles.rejectButton]}
                  onPress={handleRejectBill}
                  disabled={isProcessingPayment}
                >
                  <Ionicons name="close" size={16} color="#EF4444" />
                  <Text style={styles.rejectButtonText}>Reject</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.secondaryButton]}
                onPress={handleViewDetails}
              >
                <Text style={styles.secondaryButtonText}>Details</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : paymentStatus === 'paid' || isPaid ? (
          <View style={styles.paidStatus}>
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            <Text style={styles.paidStatusText}>Payment Completed</Text>
          </View>
        ) : paymentStatus === 'rejected' ? (
          <View style={styles.rejectedStatus}>
            <Ionicons name="close-circle" size={20} color="#EF4444" />
            <Text style={styles.rejectedStatusText}>Bill Rejected</Text>
          </View>
        ) : null}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 0,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#065F46',
    marginBottom: 2,
  },
  notificationSubtitle: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '500',
  },
  notificationBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  notificationBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
  },
  billDetails: {
    padding: 16,
  },
  description: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  amountSection: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  amountLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  userShare: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#EF4444',
  },
  paidAmount: {
    color: '#10B981',
  },
  rejectedAmount: {
    color: '#EF4444',
  },
  participantsPreview: {
    marginBottom: 16,
  },
  participantsLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    fontWeight: '500',
  },
  participantsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  participantChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  participantName: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  actionsSection: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  payButton: {
    backgroundColor: '#10B981',
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
    opacity: 0.6,
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  secondaryButton: {
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  paidStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  paidStatusText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981',
  },
  rejectedStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  rejectedStatusText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#EF4444',
  },
  secondaryButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  rejectButton: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  rejectButtonText: {
    color: '#EF4444',
  },
  successOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(16, 185, 129, 0.95)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  successContent: {
    alignItems: 'center',
    padding: 20,
  },
  successText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 12,
  },
});