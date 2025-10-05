// BHIM UPI configuration
export const BHIM_UPI_CONFIG = {
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

export interface FinancialInsight {
  id: string;
  title: string;
  description: string;
  type: 'warning' | 'success' | 'tip' | 'prediction';
  icon: string;
}

export interface SpendingAnalysis {
  insights: FinancialInsight[];
  predictions: string[];
  recommendations: string[];
}