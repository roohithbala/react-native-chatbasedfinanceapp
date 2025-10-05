import React, { useState, useEffect } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  View,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import bhimUpiService from '@/lib/services/bhimUpiService';
import { BhimUpiPaymentData } from '@/lib/services/types';
import { useTheme } from '../context/ThemeContext';

interface BhimUpiButtonProps {
  amount: number;
  currency?: string;
  description: string;
  recipientName?: string;
  recipientId?: string;
  splitBillId?: string;
  groupId?: string;
  onSuccess?: (result: any) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  style?: any;
  buttonText?: string;
}

export const BhimUpiButton: React.FC<BhimUpiButtonProps> = ({
  amount,
  currency = 'INR',
  description,
  recipientName,
  recipientId,
  splitBillId,
  groupId,
  onSuccess,
  onError,
  disabled = false,
  style,
  buttonText = 'Pay with BHIM UPI',
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);
  const [showUpiModal, setShowUpiModal] = useState(false);
  const [upiId, setUpiId] = useState('');
  const [upiIdError, setUpiIdError] = useState('');
  const { theme } = useTheme();

  useEffect(() => {
    checkAvailability();
  }, []);

  const checkAvailability = async () => {
    try {
      const available = await bhimUpiService.isBhimUpiAvailable();
      setIsAvailable(available);
    } catch (error) {
      console.error('Error checking BHIM UPI availability:', error);
      setIsAvailable(false);
    }
  };

  const validateUpiId = (id: string): boolean => {
    const isValid = bhimUpiService.validateUpiId(id);
    if (!isValid) {
      setUpiIdError('Invalid UPI ID format (e.g., merchant@ybl)');
    } else {
      setUpiIdError('');
    }
    return isValid;
  };

  const handlePayment = async () => {
    if (disabled || isProcessing || !isAvailable) return;

    // Show UPI ID input modal
    setShowUpiModal(true);
  };

  const processUpiPayment = async () => {
    if (!validateUpiId(upiId)) return;

    setIsProcessing(true);
    setShowUpiModal(false);

    try {
      const paymentData: BhimUpiPaymentData = {
        amount,
        currency,
        description,
        upiId,
        recipientName,
        recipientId,
        splitBillId,
        groupId,
      };

      const result = await bhimUpiService.processPayment(paymentData);

      if (result.success) {
        Alert.alert(
          'Payment Successful',
          `Payment of ₹${amount.toFixed(2)} completed successfully!\nTransaction ID: ${result.transactionId}`,
          [
            {
              text: 'OK',
              onPress: () => onSuccess?.(result),
            },
          ]
        );
      } else {
        const errorMessage = result.error || 'Payment failed';
        Alert.alert('Payment Failed', errorMessage);
        onError?.(errorMessage);
      }
    } catch (error: any) {
      const errorMessage = error.message || 'An unexpected error occurred';
      Alert.alert('Payment Error', errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsProcessing(false);
      setUpiId('');
      setUpiIdError('');
    }
  };

  return (
    <>
      <TouchableOpacity
        style={[
          styles.button,
          disabled && styles.buttonDisabled,
          isProcessing && styles.buttonProcessing,
          style,
        ]}
        onPress={handlePayment}
        disabled={disabled || isProcessing}
      >
        {isProcessing ? (
          <ActivityIndicator color="white" size="small" />
        ) : (
          <>
            <Ionicons name="phone-portrait" size={20} color="white" style={styles.icon} />
            <Text style={[styles.buttonText, disabled && styles.buttonTextDisabled]}>
              {buttonText}
            </Text>
          </>
        )}
      </TouchableOpacity>

      {/* UPI ID Input Modal */}
      <Modal
        visible={showUpiModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowUpiModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Enter UPI ID
              </Text>
              <TouchableOpacity
                onPress={() => setShowUpiModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={[styles.instruction, { color: theme.textSecondary }]}>
                Enter the recipient's UPI ID to proceed with payment
              </Text>

              <TextInput
                style={[styles.upiInput, {
                  borderColor: upiIdError ? '#EF4444' : theme.border,
                  color: theme.text
                }]}
                value={upiId}
                onChangeText={(text) => {
                  setUpiId(text);
                  if (upiIdError) validateUpiId(text);
                }}
                placeholder="e.g., merchant@ybl, user@paytm"
                placeholderTextColor={theme.textSecondary}
                autoCapitalize="none"
                autoCorrect={false}
              />

              {upiIdError ? (
                <Text style={styles.errorText}>{upiIdError}</Text>
              ) : null}

              <View style={styles.amountDisplay}>
                <Text style={[styles.amountText, { color: theme.text }]}>
                  Amount: ₹{amount.toFixed(2)}
                </Text>
                <Text style={[styles.descriptionText, { color: theme.textSecondary }]}>
                  {description}
                </Text>
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.cancelButton, { borderColor: theme.border }]}
                onPress={() => setShowUpiModal(false)}
              >
                <Text style={[styles.cancelButtonText, { color: theme.textSecondary }]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.payButton, { backgroundColor: '#10B981' }]}
                onPress={processUpiPayment}
                disabled={!upiId.trim() || !!upiIdError}
              >
                <Text style={styles.payButtonText}>
                  Pay ₹{amount.toFixed(2)}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981', // BHIM Green
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonDisabled: {
    backgroundColor: '#CCCCCC',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonProcessing: {
    backgroundColor: '#059669',
  },
  icon: {
    marginRight: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextDisabled: {
    color: '#999999',
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
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  instruction: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  upiInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 8,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginBottom: 16,
  },
  amountDisplay: {
    alignItems: 'center',
    marginTop: 16,
  },
  amountText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  descriptionText: {
    fontSize: 14,
    textAlign: 'center',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  payButton: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  payButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default BhimUpiButton;