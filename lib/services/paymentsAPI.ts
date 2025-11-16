import api from './api';

export interface Payment {
  _id: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  paymentMethod: string;
  notes?: string;
  confirmedBy: {
    userId: string;
    confirmedAt: Date;
  }[];
  createdAt: Date;
}

export interface PaymentSummary {
  totalPaid: number;
  totalOwed: number;
  balance: number;
  participants: {
    userId: string;
    name: string;
    amountOwed: number;
    amountPaid: number;
    balance: number;
    isPaid: boolean;
  }[];
}

export interface Debt {
  fromUserId: string;
  toUserId: string;
  amount: number;
  fromUserName: string;
  toUserName: string;
}

export interface SettlementPlan {
  fromUserId: string;
  toUserId: string;
  amount: number;
  fromUserName: string;
  toUserName: string;
  billId?: string; // Add optional bill ID for easier lookup
  billDescription?: string; // Add optional bill description
  billCategory?: string;
  billDate?: Date;
  billNotes?: string;
  participants?: any[];
  splitType?: string;
  totalAmount?: number;
  groupId?: string;
  groupName?: string;
}

export interface Reminder {
  _id: string;
  userId: string;
  type: 'payment_due' | 'settlement_reminder' | 'confirmation_needed';
  message: string;
  isRead: boolean;
  createdAt: Date;
}

export class PaymentsAPI {
  static async markParticipantAsPaid(
    splitBillId: string,
    participantId: string,
    paymentMethod: string,
    notes?: string
  ): Promise<any> {
    try {
      const response = await api.post(
        `/payments/${splitBillId}/participants/${participantId}/pay`,
        { paymentMethod, notes }
      );
      return response.data;
    } catch (error) {
      console.error('Mark participant as paid error:', error);
      throw error;
    }
  }

  static async confirmPayment(splitBillId: string, paymentId: string): Promise<any> {
    try {
      const response = await api.post(
        `/payments/${splitBillId}/payments/${paymentId}/confirm`
      );
      return response.data;
    } catch (error) {
      console.error('Confirm payment error:', error);
      throw error;
    }
  }

  static async getPaymentSummary(splitBillId: string): Promise<{
    status: string;
    data: {
      splitBill: any;
      summary: PaymentSummary;
      debts: Debt[];
    };
  }> {
    try {
      const response = await api.get(`/payments/${splitBillId}/summary`);
      return response.data;
    } catch (error) {
      console.error('Get payment summary error:', error);
      throw error;
    }
  }

  static async getGroupSettlement(groupId: string): Promise<{
    settlement: SettlementPlan[];
    group: any;
  }> {
    try {
      const response = await api.get(`/payments/groups/${groupId}/settlement`);
      return response.data;
    } catch (error) {
      console.error('Get group settlement error:', error);
      throw error;
    }
  }

  static async addReminder(
    splitBillId: string,
    userId: string,
    type: 'payment_due' | 'settlement_reminder' | 'confirmation_needed',
    message: string
  ): Promise<any> {
    try {
      const response = await api.post(`/payments/${splitBillId}/reminders`, {
        userId,
        type,
        message
      });
      return response.data;
    } catch (error) {
      console.error('Add reminder error:', error);
      throw error;
    }
  }

  static async getPaymentHistory(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    status: string;
    data: {
      payments: any[];
      totalPages: number;
      currentPage: number;
      total: number;
    };
  }> {
    try {
      const response = await api.get(`/payments/users/${userId}/history`, {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      console.error('Get payment history error:', error);
      throw error;
    }
  }

  static async processBhimUpiTransaction(
    paymentData: {
      upiId: string;
      amount: number;
      currency: string;
      description: string;
      recipientId?: string;
      splitBillId?: string;
      groupId?: string;
    }
  ): Promise<any> {
    try {
      const response = await api.post('/payments/bhim-upi', paymentData);
      return response.data;
    } catch (error) {
      console.error('BHIM UPI transaction error:', error);
      throw error;
    }
  }

  static async processCardTransaction(
    paymentData: {
      cardNumber: string;
      expiry: string;
      cvv: string;
      nameOnCard?: string;
      amount: number;
      currency?: string;
      description?: string;
      recipientId?: string;
      splitBillId?: string;
      groupId?: string;
    }
  ): Promise<any> {
    try {
      const response = await api.post('/payments/card', paymentData);
      return response.data;
    } catch (error) {
      console.error('Card transaction error:', error);
      throw error;
    }
  }

  static async createBhimUpiPaymentIntent(
    paymentData: {
      amount: number;
      currency: string;
      description: string;
      upiId: string;
      recipientId?: string;
      splitBillId?: string;
      groupId?: string;
    }
  ): Promise<any> {
    try {
      const response = await api.post('/payments/create-bhim-upi-intent', paymentData);
      return response.data;
    } catch (error) {
      console.error('BHIM UPI payment intent creation error:', error);
      throw error;
    }
  }

  static async generateUpiQrCode(
    qrData: {
      amount: number;
      currency: string;
      description: string;
      upiId: string;
    }
  ): Promise<any> {
    try {
      const response = await api.post('/payments/generate-upi-qr', qrData);
      return response.data;
    } catch (error) {
      console.error('UPI QR code generation error:', error);
      throw error;
    }
  }

  static async verifyBhimUpiPayment(transactionId: string): Promise<any> {
    try {
      const response = await api.get(`/payments/bhim-upi/verify/${transactionId}`);
      return response.data;
    } catch (error) {
      console.error('BHIM UPI payment verification error:', error);
      throw error;
    }
  }

  static async refundBhimUpiTransaction(
    transactionId: string,
    amount?: number,
    reason?: string
  ): Promise<any> {
    try {
      const response = await api.post('/payments/bhim-upi/refund', {
        transactionId,
        amount,
        reason,
      });
      return response.data;
    } catch (error) {
      console.error('BHIM UPI refund error:', error);
      throw error;
    }
  }

 
}

export default PaymentsAPI;