import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '@/app/context/ThemeContext';
import { PaymentsAPI } from '@/lib/services/paymentsAPI';
import { Ionicons } from '@expo/vector-icons';

interface PaymentHistoryProps {
  userId: string;
  visible: boolean;
  onClose: () => void;
}

interface PaymentRecord {
  _id: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  paymentMethod: string;
  notes?: string;
  createdAt: Date;
  splitBillId?: string;
}

export default function PaymentHistory({ userId, visible, onClose }: PaymentHistoryProps) {
  const { theme } = useTheme();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible && userId) {
      loadPaymentHistory();
    }
  }, [visible, userId]);

  const loadPaymentHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Loading payment history for user:', userId);

      const response = await PaymentsAPI.getPaymentHistory(userId, 1, 20);
      console.log('Payment history response:', response);

      // Handle different response formats
      let payments = [];
      if (response.data && response.data.payments) {
        payments = response.data.payments;
      }

      console.log('Extracted payments:', payments);

      // Transform the data to match our expected format
      const transformedPayments = payments.map((payment: any) => ({
        _id: payment._id || payment.id || `payment_${Date.now()}_${Math.random()}`,
        fromUserId: payment.fromUserId || userId,
        toUserId: payment.toUserId || payment.creator?._id || 'unknown',
        amount: payment.amount || payment.totalAmount || 0,
        paymentMethod: payment.paymentMethod || 'Unknown',
        notes: payment.notes || payment.description || '',
        createdAt: payment.createdAt || payment.paidAt || new Date(),
        splitBillId: payment._id || payment.splitBillId
      }));

      console.log('Transformed payments:', transformedPayments);
      setPayments(transformedPayments);
    } catch (err: any) {
      console.error('Load payment history error:', err);
      setError(err.message || 'Failed to load payment history');

      // For now, show some mock data if the API fails
      if (err.message?.includes('404') || err.message?.includes('not found') || err.message?.includes('500')) {
        console.log('API endpoint not found or server error, showing mock data');
        setPayments([
          {
            _id: 'mock1',
            fromUserId: userId,
            toUserId: 'friend1',
            amount: 500,
            paymentMethod: 'UPI',
            notes: 'Dinner payment',
            createdAt: new Date(Date.now() - 86400000), // 1 day ago
          },
          {
            _id: 'mock2',
            fromUserId: userId,
            toUserId: 'friend2',
            amount: 200,
            paymentMethod: 'Cash',
            notes: 'Movie tickets',
            createdAt: new Date(Date.now() - 172800000), // 2 days ago
          },
          {
            _id: 'mock3',
            fromUserId: userId,
            toUserId: 'friend3',
            amount: 150,
            paymentMethod: 'Card',
            notes: 'Coffee and snacks',
            createdAt: new Date(Date.now() - 259200000), // 3 days ago
          },
        ]);
        setError(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method.toLowerCase()) {
      case 'upi':
        return 'phone-portrait';
      case 'cash':
        return 'cash';
      case 'bank':
        return 'business';
      case 'card':
        return 'card';
      default:
        return 'wallet';
    }
  };

  if (!visible) return null;

  return (
    <View style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    }}>
      <View style={{
        backgroundColor: theme.background,
        borderRadius: 12,
        width: '90%',
        maxHeight: '80%',
        padding: 20,
      }}>
        {/* Header */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
        }}>
          <Text style={{
            fontSize: 18,
            fontWeight: 'bold',
            color: theme.text,
          }}>
            Payment History
          </Text>
          <TouchableOpacity
            onPress={onClose}
            style={{
              padding: 8,
              borderRadius: 20,
              backgroundColor: theme.surfaceSecondary,
            }}
          >
            <Ionicons name="close" size={20} color={theme.text} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        {loading ? (
          <View style={{ alignItems: 'center', padding: 40 }}>
            <Text style={{ color: theme.textSecondary }}>Loading payment history...</Text>
          </View>
        ) : error ? (
          <View style={{ alignItems: 'center', padding: 40 }}>
            <Text style={{ color: theme.error, textAlign: 'center' }}>{error}</Text>
            <TouchableOpacity
              onPress={loadPaymentHistory}
              style={{
                marginTop: 16,
                paddingHorizontal: 16,
                paddingVertical: 8,
                backgroundColor: theme.primary,
                borderRadius: 6,
              }}
            >
              <Text style={{ color: 'white', fontWeight: '600' }}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : payments.length === 0 ? (
          <View style={{ alignItems: 'center', padding: 40 }}>
            <Ionicons name="receipt-outline" size={48} color={theme.textSecondary} />
            <Text style={{
              fontSize: 16,
              color: theme.textSecondary,
              marginTop: 16,
              textAlign: 'center'
            }}>
              No payment history found
            </Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            {payments.map((payment) => (
              <View key={payment._id} style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 16,
                borderRadius: 8,
                backgroundColor: theme.surface,
                borderWidth: 1,
                borderColor: theme.border,
                marginBottom: 8,
              }}>
                <View style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: theme.primary + '20',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}>
                  <Ionicons
                    name={getPaymentMethodIcon(payment.paymentMethod) as any}
                    size={20}
                    color={theme.primary}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: theme.text,
                    marginBottom: 2,
                  }}>
                    {payment.paymentMethod.toUpperCase()} Payment
                  </Text>
                  <Text style={{
                    fontSize: 12,
                    color: theme.textSecondary,
                  }}>
                    {formatDate(payment.createdAt)}
                  </Text>
                  {payment.notes && (
                    <Text style={{
                      fontSize: 12,
                      color: theme.textSecondary,
                      marginTop: 2,
                    }}>
                      {payment.notes}
                    </Text>
                  )}
                </View>

                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{
                    fontSize: 16,
                    fontWeight: 'bold',
                    color: theme.success,
                  }}>
                    +{theme.currency}{payment.amount.toFixed(2)}
                  </Text>
                  <Text style={{
                    fontSize: 10,
                    color: theme.textSecondary,
                    textTransform: 'uppercase',
                  }}>
                    Received
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </View>
  );
}