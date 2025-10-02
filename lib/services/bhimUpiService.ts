import AsyncStorage from '@react-native-async-storage/async-storage';

// BHIM UPI configuration
const BHIM_UPI_CONFIG = {
  merchantName: 'ChatFinance',
  merchantCode: process.env.EXPO_PUBLIC_BHIM_MERCHANT_CODE || 'BCR2DN6TZ6S6BHXV',
  supportedApps: ['PHONEPE', 'PAYTM', 'GPAY', 'AMAZONPAY', 'BHIM'],
  transactionTimeout: 15 * 60 * 1000, // 15 minutes
};

export interface BhimUpiPaymentData {
  amount: number;
  currency: string;
  description: string;
  upiId: string;
  recipientName?: string;
  recipientId?: string;
  splitBillId?: string;
  groupId?: string;
}

export interface BhimUpiResult {
  success: boolean;
  transactionId?: string;
  upiString?: string;
  qrCodeData?: string;
  error?: string;
  paymentStatus?: 'initiated' | 'completed' | 'failed' | 'pending';
}

export interface UpiQrData {
  upiString: string;
  transactionId: string;
  amount: number;
  currency: string;
  upiId: string;
  description: string;
  generatedAt: Date;
  expiresAt: Date;
}

class BhimUpiService {
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

  // Utility function to validate UPI ID format
  validateUpiId(upiId: string): boolean {
    const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/;
    return upiRegex.test(upiId);
  }

  // Get supported UPI apps
  getSupportedApps(): string[] {
    return BHIM_UPI_CONFIG.supportedApps;
  }

  // Get merchant configuration
  getMerchantConfig() {
    return {
      name: BHIM_UPI_CONFIG.merchantName,
      code: BHIM_UPI_CONFIG.merchantCode,
    };
  }
}

export const bhimUpiService = new BhimUpiService();
export default bhimUpiService;