import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, Linking } from 'react-native';
import { useTheme, hexToRgba } from '@/app/context/ThemeContext';
import { SettlementPlan , PaymentsAPI } from '@/lib/services/paymentsAPI';
import { Ionicons } from '@expo/vector-icons';


interface SettlementCardProps {
  settlement: SettlementPlan;
  onSettlePayment: (settlement: SettlementPlan) => void;
}

export default function SettlementCard({ settlement, onSettlePayment }: SettlementCardProps) {
  const { theme } = useTheme();
  const [showDetails, setShowDetails] = useState(false);
  const [processingUPI, setProcessingUPI] = useState(false);

  const formatDate = (date: Date | string) => {
    if (!date) return 'Unknown';
    const d = new Date(date);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const handleSendReminder = async () => {
    try {
      Alert.alert(
        'Send Reminder',
        `Send a payment reminder to ${settlement.toUserName} for ${theme.currency}${settlement.amount.toFixed(2)}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Send',
            onPress: async () => {
              try {
                await PaymentsAPI.addReminder(
                  settlement.billId!,
                  settlement.fromUserId,
                  'payment_due',
                  `Reminder: You owe ${theme.currency}${settlement.amount.toFixed(2)} for "${settlement.billDescription}"`
                );
                Alert.alert('Success', 'Payment reminder sent successfully!');
              } catch (error) {
                console.error('Send reminder error:', error);
                Alert.alert('Error', 'Failed to send reminder. Please try again.');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Send reminder error:', error);
      Alert.alert('Error', 'Failed to send reminder. Please try again.');
    }
  };

  const handleUPIPayment = async () => {
    try {
      setProcessingUPI(true);

      // Check if UPI apps are available
      const bhimUpiService = (await import('@/lib/services/bhimUpiService')).default;
      const isAvailable = await bhimUpiService.isBhimUpiAvailable();

      if (!isAvailable) {
        Alert.alert('UPI Not Available', 'No UPI apps found on your device. Please install Google Pay, PhonePe, Paytm, or BHIM UPI to make payments.');
        return;
      }

      // Show UPI ID input modal instead of direct payment
      // For settlements, we need the recipient's UPI ID
      Alert.alert(
        'UPI Payment',
        'To make a UPI payment, please use the "Pay with BHIM UPI" option in the payment modal or contact the recipient directly for their UPI ID.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('UPI payment error:', error);
      Alert.alert('Error', 'Failed to check UPI availability. Please try again.');
    } finally {
      setProcessingUPI(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      'Food': 'restaurant',
      'Transport': 'car',
      'Entertainment': 'game-controller',
      'Shopping': 'bag',
      'Bills': 'receipt',
      'Health': 'medical',
      'Education': 'school',
      'Other': 'ellipsis-horizontal'
    };
    return icons[category] || 'ellipsis-horizontal';
  };

  return (
    <View style={{
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      marginBottom: 12,
      backgroundColor: theme.surface,
      borderColor: theme.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
      }}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <Ionicons
              name={getCategoryIcon(settlement.billCategory || 'Other') as any}
              size={16}
              color={theme.primary}
              style={{ marginRight: 6 }}
            />
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: theme.text,
              flex: 1,
            }} numberOfLines={1}>
              {settlement.billDescription}
            </Text>
          </View>
          <Text style={{
            fontSize: 14,
            color: theme.textSecondary,
            marginBottom: 4,
          }}>
            To: {settlement.toUserName}
          </Text>
          <Text style={{
            fontSize: 12,
            color: theme.textSecondary,
          }}>
            {formatDate(settlement.billDate || new Date())}
          </Text>
        </View>

        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{
            fontSize: 18,
            fontWeight: 'bold',
            color: theme.error,
            marginBottom: 4,
          }}>
            {theme.currency}{settlement.amount.toFixed(2)}
          </Text>
          <TouchableOpacity
            onPress={() => setShowDetails(!showDetails)}
            style={{
              paddingHorizontal: 8,
              paddingVertical: 4,
              backgroundColor: theme.surfaceSecondary,
              borderRadius: 4,
            }}
          >
            <Text style={{
              fontSize: 12,
              color: theme.primary,
              fontWeight: '500',
            }}>
              {showDetails ? 'Hide' : 'Details'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Expanded Details */}
      {showDetails && (
        <View style={{
          borderTopWidth: 1,
          borderTopColor: theme.border,
          paddingTop: 12,
          marginBottom: 12,
        }}>
          {/* Bill Details */}
          <View style={{ marginBottom: 12 }}>
            <Text style={{
              fontSize: 14,
              fontWeight: '600',
              color: theme.text,
              marginBottom: 8,
            }}>
              Bill Details
            </Text>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={{ fontSize: 13, color: theme.textSecondary }}>Total Amount:</Text>
              <Text style={{ fontSize: 13, color: theme.text, fontWeight: '500' }}>
                {theme.currency}{settlement.totalAmount?.toFixed(2) || settlement.amount.toFixed(2)}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={{ fontSize: 13, color: theme.textSecondary }}>Split Type:</Text>
              <Text style={{ fontSize: 13, color: theme.text, fontWeight: '500' }}>
                {settlement.splitType || 'Equal'}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={{ fontSize: 13, color: theme.textSecondary }}>Category:</Text>
              <Text style={{ fontSize: 13, color: theme.text, fontWeight: '500' }}>
                {settlement.billCategory || 'Other'}
              </Text>
            </View>

            {settlement.groupName && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ fontSize: 13, color: theme.textSecondary }}>Type:</Text>
                <Text style={{ fontSize: 13, color: theme.text, fontWeight: '500' }}>
                  {settlement.groupName}
                </Text>
              </View>
            )}
          </View>

          {/* Participants */}
          {settlement.participants && settlement.participants.length > 0 && (
            <View style={{ marginBottom: 12 }}>
              <Text style={{
                fontSize: 14,
                fontWeight: '600',
                color: theme.text,
                marginBottom: 8,
              }}>
                Participants ({settlement.participants.length})
              </Text>

              {settlement.participants.map((participant, index) => {
                const userName = typeof participant.userId === 'object'
                  ? participant.userId.name
                  : 'Unknown';
                const isCurrentUser = typeof participant.userId === 'object'
                  ? participant.userId._id === settlement.fromUserId
                  : false;

                return (
                  <View key={index} style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingVertical: 4,
                    paddingHorizontal: 8,
                    backgroundColor: isCurrentUser ? hexToRgba(theme.primary, 0.1) : 'transparent',
                    borderRadius: 4,
                    marginBottom: 2,
                  }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={{
                        fontSize: 13,
                        color: isCurrentUser ? theme.primary : theme.text,
                        fontWeight: isCurrentUser ? '600' : '400',
                      }}>
                        {userName} {isCurrentUser ? '(You)' : ''}
                      </Text>
                      {participant.isPaid && (
                        <Ionicons
                          name="checkmark-circle"
                          size={14}
                          color={theme.success}
                          style={{ marginLeft: 6 }}
                        />
                      )}
                    </View>
                    <Text style={{
                      fontSize: 13,
                      color: theme.text,
                      fontWeight: '500',
                    }}>
                      {theme.currency}{participant.amount.toFixed(2)}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* Notes */}
          {settlement.billNotes && (
            <View style={{ marginBottom: 12 }}>
              <Text style={{
                fontSize: 14,
                fontWeight: '600',
                color: theme.text,
                marginBottom: 4,
              }}>
                Notes
              </Text>
              <Text style={{
                fontSize: 13,
                color: theme.textSecondary,
                lineHeight: 18,
              }}>
                {settlement.billNotes}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Action Buttons */}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 8,
      }}>
        <TouchableOpacity
          style={{
            flex: 1,
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderRadius: 6,
            backgroundColor: theme.warning,
            alignItems: 'center',
          }}
          onPress={handleSendReminder}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons
              name="notifications"
              size={14}
              color="white"
              style={{ marginRight: 4 }}
            />
            <Text style={{
              color: 'white',
              fontSize: 12,
              fontWeight: '600',
            }}>
              Remind
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            flex: 1,
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderRadius: 6,
            backgroundColor: theme.primary,
            alignItems: 'center',
            opacity: processingUPI ? 0.6 : 1,
          }}
          onPress={handleUPIPayment}
          disabled={processingUPI}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons
              name="phone-portrait"
              size={14}
              color="white"
              style={{ marginRight: 4 }}
            />
            <Text style={{
              color: 'white',
              fontSize: 12,
              fontWeight: '600',
            }}>
              {processingUPI ? '...' : 'UPI Pay'}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            flex: 1,
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderRadius: 6,
            backgroundColor: theme.success,
            alignItems: 'center',
          }}
          onPress={() => onSettlePayment(settlement)}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons
              name="checkmark-circle"
              size={14}
              color="white"
              style={{ marginRight: 4 }}
            />
            <Text style={{
              color: 'white',
              fontSize: 12,
              fontWeight: '600',
            }}>
              Paid
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}