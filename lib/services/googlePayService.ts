import { Platform } from 'react-native';
import { initStripe, presentPaymentSheet, confirmPaymentSheetPayment } from '@stripe/stripe-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Google Pay configuration
const GOOGLE_PAY_CONFIG = {
  merchantName: 'Secure Finance App',
  merchantId: process.env.EXPO_PUBLIC_STRIPE_MERCHANT_ID || 'your-merchant-id',
  publishableKey: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'your-stripe-key',
  testEnv: __DEV__, // Use test environment in development
};

export interface GooglePayPaymentData {
  amount: number;
  currency: string;
  description: string;
  recipientName?: string;
  recipientId?: string;
  splitBillId?: string;
  groupId?: string;
}

export interface GooglePayResult {
  success: boolean;
  transactionId?: string;
  error?: string;
  paymentMethod?: any;
}

class GooglePayService {
  private isInitialized = false;

  private async getAuthHeaders(): Promise<{ [key: string]: string }> {
    try {
      const token = await AsyncStorage.getItem('authToken');
      return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
    } catch (error) {
      console.error('Error getting auth token:', error);
      return {
        'Content-Type': 'application/json',
      };
    }
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      if (Platform.OS === 'android') {
        await initStripe({
          publishableKey: GOOGLE_PAY_CONFIG.publishableKey,
          merchantIdentifier: GOOGLE_PAY_CONFIG.merchantId,
        });
      }
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize Stripe:', error);
      throw error;
    }
  }

  async isGooglePayAvailable(): Promise<boolean> {
    try {
      // For now, we'll assume Google Pay is available on Android
      // In a real implementation, you'd check if Google Pay is supported
      return Platform.OS === 'android';
    } catch (error) {
      console.error('Error checking Google Pay availability:', error);
      return false;
    }
  }

  async createPaymentIntent(paymentData: GooglePayPaymentData): Promise<string> {
    try {
      const headers = await this.getAuthHeaders();
      
      // This should call your backend to create a payment intent
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/payments/create-payment-intent`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          amount: paymentData.amount,
          currency: paymentData.currency,
          description: paymentData.description,
          recipientId: paymentData.recipientId,
          splitBillId: paymentData.splitBillId,
          groupId: paymentData.groupId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      const result = await response.json();
      return result.clientSecret;
    } catch (error: any) {
      console.error('Payment intent creation error:', error);
      throw error;
    }
  }

  async processPayment(paymentData: GooglePayPaymentData): Promise<GooglePayResult> {
    try {
      await this.initialize();

      if (!(await this.isGooglePayAvailable())) {
        return {
          success: false,
          error: 'Google Pay is not available on this device',
        };
      }

      // For demo purposes, simulate Google Pay payment
      // In production, you would use Stripe's presentPaymentSheet here
      console.log('Processing Google Pay payment:', paymentData);

      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simulate successful payment
      const transactionId = `gpay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Call backend to record the transaction
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/payments/google-pay`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          transactionId,
          amount: paymentData.amount,
          currency: paymentData.currency,
          description: paymentData.description,
          recipientId: paymentData.recipientId,
          splitBillId: paymentData.splitBillId,
          groupId: paymentData.groupId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to record payment');
      }

      return {
        success: true,
        transactionId,
      };
    } catch (error: any) {
      console.error('Google Pay payment error:', error);
      return {
        success: false,
        error: error.message || 'An unexpected error occurred',
      };
    }
  }

  async refundPayment(transactionId: string, amount?: number): Promise<GooglePayResult> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/payments/google-pay/refund`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          transactionId,
          amount,
        }),
      });

      if (!response.ok) {
        throw new Error('Refund failed');
      }

      const result = await response.json();

      return {
        success: true,
        transactionId: result.refundId,
      };
    } catch (error: any) {
      console.error('Refund error:', error);
      return {
        success: false,
        error: error.message || 'Refund failed',
      };
    }
  }
}

export const googlePayService = new GooglePayService();
export default googlePayService;