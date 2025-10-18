import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import { BhimUpiPaymentData, BhimUpiResult, BHIM_UPI_CONFIG } from './types';

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
    try {
      // Check if any popular UPI apps are available on the device
      // Try multiple approaches for better detection

      // 1. Check app-specific URL schemes
      const appSchemes = [
        'tez://', // Google Pay
        'tez://upi/pay', // Google Pay UPI
        'phonepe://', // PhonePe
        'phonepe://pay', // PhonePe UPI
        'paytmmp://', // Paytm
        'paytmmp://pay', // Paytm UPI
        'bhim://', // BHIM UPI
        'bhim://pay', // BHIM UPI payment
        'amazonpay://', // Amazon Pay
        'cred://', // CRED
        'whatsapp://', // WhatsApp UPI (if available)
      ];

      for (const scheme of appSchemes) {
        try {
          const canOpen = await Linking.canOpenURL(scheme);
          if (canOpen) {
            console.log(`UPI app available via scheme: ${scheme}`);
            return true;
          }
        } catch (error) {
          // Continue checking other schemes
          console.log(`Cannot open scheme ${scheme}:`, error);
        }
      }

      // 2. Check generic UPI URL support
      const upiUrls = [
        'upi://pay',
        'upi://pay?pa=test@ybl',
        'tez://upi/pay?pa=test@ybl&pn=Test&am=1&cu=INR',
        'phonepe://pay?pa=test@ybl&pn=Test&am=1&cu=INR',
        'paytmmp://pay?pa=test@ybl&pn=Test&am=1&cu=INR',
        'bhim://pay?pa=test@ybl&pn=Test&am=1&cu=INR',
      ];

      for (const url of upiUrls) {
        try {
          const canOpen = await Linking.canOpenURL(url);
          if (canOpen) {
            console.log(`UPI URL supported: ${url}`);
            return true;
          }
        } catch (error) {
          console.log(`Cannot open UPI URL ${url}:`, error);
        }
      }

      // 3. Check for installed payment apps that might support UPI
      // This is a more aggressive approach - try common payment app schemes
      const paymentApps = [
        'gpay://', // Alternative Google Pay scheme
        'paytm://', // Alternative Paytm scheme
        'credpay://', // CRED alternative
        'mobikwik://', // MobiKwik
        'freecharge://', // FreeCharge
        'ola://', // Ola Money
        'jiomoney://', // JioMoney
        'sbi://', // SBI YONO
        'axis://', // Axis Bank
        'hdfc://', // HDFC Bank
        'icici://', // ICICI Bank
      ];

      for (const app of paymentApps) {
        try {
          const canOpen = await Linking.canOpenURL(app);
          if (canOpen) {
            console.log(`Payment app available: ${app}`);
            return true;
          }
        } catch (error) {
          console.log(`Cannot open payment app ${app}:`, error);
        }
      }

      console.log('No UPI apps found on device');
      return false;
    } catch (error) {
      console.error('Error checking UPI availability:', error);
      // Return true as fallback to not block payments completely
      // Many devices have UPI support even if detection fails
      return true;
    }
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
      console.log('Processing BHIM UPI payment:', paymentData);

      // Create UPI payment URL directly instead of relying on backend
      const upiUrl = this.generateUpiPaymentUrl(paymentData);

      console.log('Generated UPI URL:', upiUrl);

      // Try to open the UPI URL directly
      const canOpen = await Linking.canOpenURL(upiUrl);
      if (canOpen) {
        await Linking.openURL(upiUrl);

        // Create payment intent for tracking (optional)
        try {
          await this.createPaymentIntent(paymentData);
        } catch (intentError) {
          console.warn('Failed to create payment intent, but UPI app opened:', intentError);
        }

        return {
          success: true,
          transactionId: `upi_${Date.now()}`,
          upiString: upiUrl,
          paymentStatus: 'initiated',
        };
      } else {
        // Fallback: Try alternative UPI apps
        const alternativeUrls = this.generateAlternativeUpiUrls(paymentData);

        for (const altUrl of alternativeUrls) {
          try {
            const canOpenAlt = await Linking.canOpenURL(altUrl);
            if (canOpenAlt) {
              console.log('Using alternative UPI URL:', altUrl);
              await Linking.openURL(altUrl);

              return {
                success: true,
                transactionId: `upi_alt_${Date.now()}`,
                upiString: altUrl,
                paymentStatus: 'initiated',
              };
            }
          } catch (error) {
            console.log('Alternative UPI URL failed:', altUrl, error);
          }
        }

        return {
          success: false,
          error: 'No UPI app could be opened. Please install Google Pay, PhonePe, Paytm, or BHIM UPI.',
        };
      }
    } catch (error: any) {
      console.error('BHIM UPI payment error:', error);
      return {
        success: false,
        error: error.message || 'An unexpected error occurred',
      };
    }
  }

  private generateUpiPaymentUrl(paymentData: BhimUpiPaymentData): string {
    // Generate a standard UPI payment URL
    const params = new URLSearchParams({
      pa: paymentData.upiId, // Payee UPI ID
      pn: paymentData.recipientName || 'Recipient', // Payee name
      am: paymentData.amount.toString(), // Amount
      cu: paymentData.currency || 'INR', // Currency
      tn: paymentData.description || 'Payment', // Transaction note
    });

    return `tez://upi/pay?${params.toString()}`;
  }

  private generateAlternativeUpiUrls(paymentData: BhimUpiPaymentData): string[] {
    const baseParams = {
      pa: paymentData.upiId,
      pn: paymentData.recipientName || 'Recipient',
      am: paymentData.amount.toString(),
      cu: paymentData.currency || 'INR',
      tn: paymentData.description || 'Payment',
    };

    const paramString = new URLSearchParams(baseParams).toString();

    return [
      `tez://upi/pay?${paramString}`, // Google Pay
      `phonepe://pay?${paramString}`, // PhonePe
      `paytmmp://pay?${paramString}`, // Paytm
      `bhim://pay?${paramString}`, // BHIM UPI
      `amazonpay://pay?${paramString}`, // Amazon Pay
      `cred://pay?${paramString}`, // CRED
    ];
  }
}