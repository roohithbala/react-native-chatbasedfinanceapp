import AsyncStorage from '@react-native-async-storage/async-storage';
import { BhimUpiResult } from './types';

export class UpiTransactionManager {
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

  async verifyPayment(transactionId: string): Promise<{
    transactionId: string;
    paymentStatus: 'completed' | 'pending' | 'failed';
    verifiedAt: Date;
  }> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/payments/bhim-upi/verify/${transactionId}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to verify payment');
      }

      const result = await response.json();
      return result.data;
    } catch (error: any) {
      console.error('Payment verification error:', error);
      throw error;
    }
  }

  async refundPayment(transactionId: string, amount?: number, reason?: string): Promise<BhimUpiResult> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/payments/bhim-upi/refund`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          transactionId,
          amount,
          reason,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Refund failed');
      }

      const result = await response.json();

      return {
        success: true,
        transactionId: result.data.refundId,
      };
    } catch (error: any) {
      console.error('BHIM UPI refund error:', error);
      return {
        success: false,
        error: error.message || 'Refund failed',
      };
    }
  }

  async getTransactionHistory(userId: string, limit: number = 50): Promise<any[]> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/payments/bhim-upi/history/${userId}?limit=${limit}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to get transaction history');
      }

      const result = await response.json();
      return result.data.transactions;
    } catch (error: any) {
      console.error('Transaction history error:', error);
      throw error;
    }
  }

  async getTransactionDetails(transactionId: string): Promise<any> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/payments/bhim-upi/transaction/${transactionId}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to get transaction details');
      }

      const result = await response.json();
      return result.data;
    } catch (error: any) {
      console.error('Transaction details error:', error);
      throw error;
    }
  }
}