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
import { TextInput } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import BhimUpiButton from './BhimUpiButton';
import PaymentsAPI from '@/lib/services/paymentsAPI';
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

  const [showCardForm, setShowCardForm] = useState(false);

  const handleCardSubmit = async (cardData: { cardNumber: string; expiry: string; cvv: string; name?: string }) => {
    try {
      // Basic client-side validation
      if (!cardData.cardNumber || !cardData.expiry || !cardData.cvv) {
        Alert.alert('Invalid card details', 'Please fill all card fields');
        return;
      }
      const payload = {
        ...cardData,
        amount,
        currency: 'INR',
        description,
        recipientId,
        splitBillId,
        groupId,
      };
      const result = await PaymentsAPI.processCardTransaction(payload as any);
      if (result && result.status === 'success') {
        Alert.alert('Payment Successful', `₹${amount.toFixed(2)} charged to card.`);
        onSuccess?.(result);
        onClose();
      } else {
        const msg = result?.message || 'Card payment failed';
        handlePaymentError(msg);
      }
    } catch (err: any) {
      handlePaymentError(err?.message || 'Card payment failed');
    }
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
              <Text style={[styles.methodTitle, { color: theme.text }]}>Choose payment method</Text>
              <Text style={[styles.methodDescription, { color: theme.textSecondary, marginBottom: 12 }]}>Multiple real-world options supported</Text>

              {/* UPI options (use BhimUpiButton which opens UPI modal) */}
              <View style={{ width: '100%', marginBottom: 12 }}>
                <BhimUpiButton
                  amount={amount}
                  description={description}
                  recipientName={recipientName}
                  recipientId={recipientId}
                  groupId={groupId}
                  splitBillId={splitBillId}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                  buttonText={`Pay ₹${amount.toFixed(2)} with UPI`}
                />
              </View>

              {/* Card payment */}
              <TouchableOpacity
                style={[styles.altButton, { backgroundColor: '#2563EB', marginBottom: 12 }]}
                onPress={() => setShowCardForm(true)}
              >
                <Ionicons name="card" size={18} color="white" style={{ marginRight: 8 }} />
                <Text style={{ color: 'white', fontWeight: '600' }}>Pay with Card</Text>
              </TouchableOpacity>

              {/* Cash / Manual */}
              <TouchableOpacity
                style={[styles.altButton, { backgroundColor: '#6B7280' }]}
                onPress={async () => {
                  try {
                    // Mark as paid locally / via API - use PaymentsAPI.markParticipantAsPaid when appropriate
                    await PaymentsAPI.markParticipantAsPaid(splitBillId || '', recipientId || '', 'cash', 'Marked as cash payment');
                    Alert.alert('Marked Paid', 'Payment marked as cash/manual.');
                    onSuccess?.({ status: 'success', method: 'cash' });
                    onClose();
                  } catch (err: any) {
                    handlePaymentError(err?.message || 'Failed to mark as paid');
                  }
                }}
              >
                <Ionicons name="cash" size={18} color="white" style={{ marginRight: 8 }} />
                <Text style={{ color: 'white', fontWeight: '600' }}>Mark as Cash / Manual</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Card form modal */}
          <Modal visible={showCardForm} animationType="slide" transparent={true} onRequestClose={() => setShowCardForm(false)}>
            <View style={styles.modalContainer}>
              <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: theme.text }]}>Card Payment</Text>
                  <TouchableOpacity onPress={() => setShowCardForm(false)} style={styles.closeButton}>
                    <Ionicons name="close" size={24} color={theme.textSecondary} />
                  </TouchableOpacity>
                </View>
                <CardForm onSubmit={handleCardSubmit} onCancel={() => setShowCardForm(false)} amount={amount} />
              </View>
            </View>
          </Modal>
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
  altButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    width: '100%',
    marginBottom: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 12,
    padding: 0,
    width: '100%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
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

// Simple card form used by PaymentModal
function CardForm({ onSubmit, onCancel, amount }: { onSubmit: (data: any) => void; onCancel: () => void; amount: number }) {
  const { theme } = useTheme();
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [name, setName] = useState('');

  return (
    <ScrollView style={{ padding: 16 }}>
      <Text style={{ color: theme.textSecondary, marginBottom: 8 }}>Card Number</Text>
      <TextInput
        value={cardNumber}
        onChangeText={setCardNumber}
        keyboardType="numeric"
        placeholder="4111 1111 1111 1111"
        placeholderTextColor={theme.textSecondary}
        style={{ borderWidth: 1, borderColor: theme.border, borderRadius: 8, padding: 12, color: theme.text, marginBottom: 12 }}
      />

      <Text style={{ color: theme.textSecondary, marginBottom: 8 }}>Expiry (MM/YY)</Text>
      <TextInput
        value={expiry}
        onChangeText={setExpiry}
        placeholder="MM/YY"
        placeholderTextColor={theme.textSecondary}
        style={{ borderWidth: 1, borderColor: theme.border, borderRadius: 8, padding: 12, color: theme.text, marginBottom: 12 }}
      />

      <Text style={{ color: theme.textSecondary, marginBottom: 8 }}>CVV</Text>
      <TextInput
        value={cvv}
        onChangeText={setCvv}
        keyboardType="numeric"
        placeholder="123"
        secureTextEntry
        placeholderTextColor={theme.textSecondary}
        style={{ borderWidth: 1, borderColor: theme.border, borderRadius: 8, padding: 12, color: theme.text, marginBottom: 12 }}
      />

      <Text style={{ color: theme.textSecondary, marginBottom: 8 }}>Name on Card</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Full name"
        placeholderTextColor={theme.textSecondary}
        style={{ borderWidth: 1, borderColor: theme.border, borderRadius: 8, padding: 12, color: theme.text, marginBottom: 16 }}
      />

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <TouchableOpacity onPress={onCancel} style={{ flex: 1, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: theme.border, alignItems: 'center' }}>
          <Text style={{ color: theme.textSecondary }}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onSubmit({ cardNumber, expiry, cvv, name })} style={{ flex: 1, padding: 12, borderRadius: 8, backgroundColor: '#2563EB', alignItems: 'center' }}>
          <Text style={{ color: 'white', fontWeight: '600' }}>Pay ₹{amount.toFixed(2)}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}