import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BhimUpiButton from './BhimUpiButton';
import { useTheme } from '../context/ThemeContext';

interface PaymentModalProps {
  visible: boolean;
  amount: number;
  description: string;
  recipientName?: string;
  recipientId?: string;
  groupId?: string;
  splitBillId?: string;
  onSuccess?: (result: any) => void;
  onError?: (error: string) => void;
  onClose: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  visible,
  amount,
  description,
  recipientName,
  recipientId,
  groupId,
  splitBillId,
  onSuccess,
  onError,
  onClose,
}) => {
  const { theme } = useTheme();

  const handlePaymentSuccess = (result: any) => {
    Alert.alert(
      'Payment Successful! 🎉',
      `₹${amount.toFixed(2)} has been sent successfully.`,
      [
        {
          text: 'OK',
          onPress: () => {
            onSuccess?.(result);
            onClose();
          },
        },
      ]
    );
  };

  const handlePaymentError = (error: string) => {
    Alert.alert('Payment Failed', error);
    onError?.(error);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: theme.surface }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <Text style={[styles.title, { color: theme.text }]}>
              Pay with BHIM UPI
            </Text>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeButton, { backgroundColor: theme.surfaceSecondary }]}
            >
              <Ionicons name="close" size={24} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Amount Display */}
          <View style={styles.amountContainer}>
            <Text style={[styles.amountLabel, { color: theme.textSecondary }]}>
              Amount to Pay
            </Text>
            <Text style={[styles.amount, { color: theme.primary }]}>
              ₹{amount.toFixed(2)}
            </Text>
            <Text style={[styles.description, { color: theme.textSecondary }]}>
              {description}
            </Text>
          </View>

          {/* Payment Method Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.methodContainer}>
              <Text style={[styles.methodTitle, { color: theme.text }]}>
                Pay with BHIM UPI
              </Text>
              <Text style={[styles.methodDescription, { color: theme.textSecondary }]}>
                Enter the recipient&apos;s UPI ID to send money instantly
              </Text>

              <BhimUpiButton
                amount={amount}
                description={description}
                recipientName={recipientName}
                recipientId={recipientId}
                groupId={groupId}
                splitBillId={splitBillId}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
                buttonText={`Pay ₹${amount.toFixed(2)} with BHIM UPI`}
              />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    minHeight: '50%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  amountContainer: {
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  amountLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  amount: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  methodContainer: {
    alignItems: 'center',
  },
  methodTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  methodDescription: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
});

export default PaymentModal;