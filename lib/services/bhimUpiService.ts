import { UpiPaymentProcessor } from './UpiPaymentProcessor';
import { UpiQrGenerator } from './UpiQrGenerator';
import { UpiTransactionManager } from './UpiTransactionManager';
import { BHIM_UPI_CONFIG, BhimUpiPaymentData, BhimUpiResult, UpiQrData } from './types';

export class BhimUpiService {
  private paymentProcessor: UpiPaymentProcessor;
  private qrGenerator: UpiQrGenerator;
  private transactionManager: UpiTransactionManager;

  constructor() {
    this.paymentProcessor = new UpiPaymentProcessor();
    this.qrGenerator = new UpiQrGenerator();
    this.transactionManager = new UpiTransactionManager();
  }

  // Payment processing
  async isBhimUpiAvailable(): Promise<boolean> {
    return this.paymentProcessor.isBhimUpiAvailable();
  }

  async createPaymentIntent(paymentData: BhimUpiPaymentData): Promise<{
    paymentIntentId: string;
    upiString: string;
    qrCodeData: string;
    transactionId: string;
  }> {
    return this.paymentProcessor.createPaymentIntent(paymentData);
  }

  async processPayment(paymentData: BhimUpiPaymentData): Promise<BhimUpiResult> {
    return this.paymentProcessor.processPayment(paymentData);
  }

  // QR code generation
  async generateQrCode(paymentData: Omit<BhimUpiPaymentData, 'recipientId' | 'splitBillId' | 'groupId'>): Promise<UpiQrData> {
    return this.qrGenerator.generateQrCode(paymentData);
  }

  generateUpiString(paymentData: Omit<BhimUpiPaymentData, 'recipientId' | 'splitBillId' | 'groupId'>): string {
    return this.qrGenerator.generateUpiString(paymentData);
  }

  validateQrData(paymentData: Omit<BhimUpiPaymentData, 'recipientId' | 'splitBillId' | 'groupId'>): boolean {
    return this.qrGenerator.validateQrData(paymentData);
  }

  // Transaction management
  async verifyPayment(transactionId: string): Promise<{
    transactionId: string;
    paymentStatus: 'completed' | 'pending' | 'failed';
    verifiedAt: Date;
  }> {
    return this.transactionManager.verifyPayment(transactionId);
  }

  async refundPayment(transactionId: string, amount?: number, reason?: string): Promise<BhimUpiResult> {
    return this.transactionManager.refundPayment(transactionId, amount, reason);
  }

  async getTransactionHistory(userId: string, limit: number = 50): Promise<any[]> {
    return this.transactionManager.getTransactionHistory(userId, limit);
  }

  async getTransactionDetails(transactionId: string): Promise<any> {
    return this.transactionManager.getTransactionDetails(transactionId);
  }

  // Utility functions
  validateUpiId(upiId: string): boolean {
    const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/;
    return upiRegex.test(upiId);
  }

  getSupportedApps(): string[] {
    return BHIM_UPI_CONFIG.supportedApps;
  }

  getMerchantConfig() {
    return {
      name: BHIM_UPI_CONFIG.merchantName,
      code: BHIM_UPI_CONFIG.merchantCode,
    };
  }
}

// Export singleton instance for backward compatibility
export const bhimUpiService = new BhimUpiService();
export default bhimUpiService;