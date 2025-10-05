import AsyncStorage from '@react-native-async-storage/async-storage';
import { BhimUpiPaymentData, UpiQrData } from './types';

export class UpiQrGenerator {
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

  async generateQrCode(paymentData: Omit<BhimUpiPaymentData, 'recipientId' | 'splitBillId' | 'groupId'>): Promise<UpiQrData> {
    try {
      const headers = await this.getAuthHeaders();

      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/payments/generate-upi-qr`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          amount: paymentData.amount,
          currency: paymentData.currency,
          description: paymentData.description,
          upiId: paymentData.upiId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate UPI QR code');
      }

      const result = await response.json();
      return result.data;
    } catch (error: any) {
      console.error('UPI QR code generation error:', error);
      throw error;
    }
  }

  // Generate UPI string manually (fallback if backend is unavailable)
  generateUpiString(paymentData: Omit<BhimUpiPaymentData, 'recipientId' | 'splitBillId' | 'groupId'>): string {
    const merchantCode = process.env.EXPO_PUBLIC_BHIM_MERCHANT_CODE || 'BCR2DN6TZ6S6BHXV';
    const merchantName = 'ChatFinance';

    // Format: upi://pay?pa={upiId}&pn={name}&am={amount}&cu={currency}&tn={description}&mc={merchantCode}
    const upiString = `upi://pay?pa=${encodeURIComponent(paymentData.upiId)}&pn=${encodeURIComponent(merchantName)}&am=${paymentData.amount}&cu=${paymentData.currency}&tn=${encodeURIComponent(paymentData.description)}&mc=${merchantCode}`;

    return upiString;
  }

  // Validate QR data before generation
  validateQrData(paymentData: Omit<BhimUpiPaymentData, 'recipientId' | 'splitBillId' | 'groupId'>): boolean {
    return !!(
      paymentData.amount > 0 &&
      paymentData.currency &&
      paymentData.description &&
      this.validateUpiId(paymentData.upiId)
    );
  }

  // Utility function to validate UPI ID format
  private validateUpiId(upiId: string): boolean {
    const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/;
    return upiRegex.test(upiId);
  }
}