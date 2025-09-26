import React, { useState, useEffect } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import googlePayService, { GooglePayPaymentData } from '@/lib/services/googlePayService';
import { useTheme } from '../context/ThemeContext';

interface GooglePayButtonProps {
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

export const GooglePayButton: React.FC<GooglePayButtonProps> = ({
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
  buttonText = 'Pay with Google Pay',
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    checkAvailability();
  }, []);

  const checkAvailability = async () => {
    try {
      const available = await googlePayService.isGooglePayAvailable();
      setIsAvailable(available);
    } catch (error) {
      console.error('Error checking Google Pay availability:', error);
      setIsAvailable(false);
    }
  };

  const handlePayment = async () => {
    if (disabled || isProcessing || !isAvailable) return;

    setIsProcessing(true);

    try {
      const paymentData: GooglePayPaymentData = {
        amount,
        currency,
        description,
        recipientName,
        recipientId,
        splitBillId,
        groupId,
      };

      const result = await googlePayService.processPayment(paymentData);

      if (result.success) {
        Alert.alert(
          'Payment Successful',
          `Payment of ${theme.currency}${amount.toFixed(2)} completed successfully!`,
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
    }
  };

  // Don't render button if Google Pay is not available on Android
  if (Platform.OS !== 'android' || !isAvailable) {
    return null;
  }

  return (
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
          <Ionicons name="logo-google" size={20} color="white" style={styles.icon} />
          <Text style={[styles.buttonText, disabled && styles.buttonTextDisabled]}>
            {buttonText}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4285F4', // Google Blue
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
    backgroundColor: '#3367D6',
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
});

export default GooglePayButton;