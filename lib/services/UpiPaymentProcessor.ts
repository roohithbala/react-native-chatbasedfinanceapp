import AsyncStorage from '@react-native-async-storage/async-storage';
import { BhimUpiPaymentData, BhimUpiResult } from './types';

export class UpiPaymentProcessor {
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

  async isBhimUpiAvailable(): Promise<boolean> {
    // BHIM UPI is available on all devices that can run UPI apps
    // In a real implementation, you might check if any UPI apps are installed
    return true;
  }

  async createPaymentIntent(paymentData: BhimUpiPaymentData): Promise<{
    paymentIntentId: string;
    upiString: string;
    qrCodeData: string;
    transactionId: string;
  }> {
    try {
      const headers = await this.getAuthHeaders();

      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/payments/create-bhim-upi-intent`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          amount: paymentData.amount,
          currency: paymentData.currency,
          description: paymentData.description,
          upiId: paymentData.upiId,
          recipientId: paymentData.recipientId,
          splitBillId: paymentData.splitBillId,
          groupId: paymentData.groupId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create BHIM UPI payment intent');
      }

      const result = await response.json();
      return result.data;
    } catch (error: any) {
      console.error('BHIM UPI payment intent creation error:', error);
      throw error;
    }
  }

  async processPayment(paymentData: BhimUpiPaymentData): Promise<BhimUpiResult> {
    try {
      if (!(await this.isBhimUpiAvailable())) {
        return {
          success: false,
          error: 'BHIM UPI is not available on this device',
        };
      }

      console.log('Processing BHIM UPI payment:', paymentData);

      // Create payment intent first
      const paymentIntent = await this.createPaymentIntent(paymentData);

      // Call backend to process the transaction
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/payments/bhim-upi`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          upiId: paymentData.upiId,
          amount: paymentData.amount,
          currency: paymentData.currency,
          description: paymentData.description,
          recipientId: paymentData.recipientId,
          splitBillId: paymentData.splitBillId,
          groupId: paymentData.groupId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to process BHIM UPI payment');
      }

      const result = await response.json();

      return {
        success: true,
        transactionId: result.data.transactionId,
        upiString: result.data.upiPaymentString,
        qrCodeData: result.data.qrCodeData,
        paymentStatus: result.data.paymentStatus,
      };
    } catch (error: any) {
      console.error('BHIM UPI payment error:', error);
      return {
        success: false,
        error: error.message || 'An unexpected error occurred',
      };
    }
  }
}