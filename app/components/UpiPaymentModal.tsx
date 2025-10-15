import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { useTheme } from '../context/ThemeContext';
import { bhimUpiService } from '@/lib/services/bhimUpiService';

interface UpiPaymentModalProps {
  visible: boolean;
  amount: number;
  description: string;
  recipientUpiId: string;
  recipientName: string;
  splitBillId: string;
  onClose: () => void;
  onPaymentSuccess: () => void;
}

const UpiPaymentModal: React.FC<UpiPaymentModalProps> = ({
  visible,
  amount,
  description,
  recipientUpiId,
  recipientName,
  splitBillId,
  onClose,
  onPaymentSuccess,
}) => {
  const { theme } = useTheme();
  const [isGenerating, setIsGenerating] = useState(false);
  const [upiString, setUpiString] = useState('');
  const [qrData, setQrData] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [countdown, setCountdown] = useState(300); // 5 minutes

  useEffect(() => {
    if (visible) {
      generatePaymentQr();
      // Start countdown timer
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            Alert.alert('Session Expired', 'Payment session has expired. Please try again.');
            onClose();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
    return undefined; // Explicitly return undefined when no cleanup needed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const generatePaymentQr = async (): Promise<void> => {
    setIsGenerating(true);
    try {
      const paymentData = {
        amount,
        currency: 'INR',
        description,
        upiId: recipientUpiId,
        recipientName,
        splitBillId,
      };

      // Generate UPI string
      const generatedUpiString = bhimUpiService.generateUpiString(paymentData);
      setUpiString(generatedUpiString);
      setQrData(generatedUpiString);

      // Generate transaction ID
      const txnId = `TXN${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      setTransactionId(txnId);

      console.log('✅ UPI Payment QR generated:', { upiString: generatedUpiString, transactionId: txnId });
    } catch (error: any) {
      console.error('❌ Failed to generate UPI QR:', error);
      Alert.alert('Error', 'Failed to generate payment QR code. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const openUpiApp = async (appScheme: string, appName: string) => {
    try {
      const upiUrl = upiString.replace('upi://pay', appScheme);
      const canOpen = await Linking.canOpenURL(upiUrl);

      if (canOpen) {
        await Linking.openURL(upiUrl);
        
        // After 5 seconds, ask if payment was successful
        setTimeout(() => {
          Alert.alert(
            'Payment Confirmation',
            `Did you complete the payment in ${appName}?`,
            [
              {
                text: 'No, Cancel',
                style: 'cancel',
              },
              {
                text: 'Yes, I Paid',
                onPress: () => {
                  onPaymentSuccess();
                  onClose();
                  Alert.alert('Success', 'Payment marked as completed! The bill creator will be notified.');
                },
              },
            ]
          );
        }, 5000);
      } else {
        Alert.alert('App Not Found', `${appName} is not installed on your device.`);
      }
    } catch (error) {
      console.error(`Error opening ${appName}:`, error);
      Alert.alert('Error', `Failed to open ${appName}. Please try another app or scan the QR code.`);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const upiApps = [
    { name: 'PhonePe', scheme: 'phonepe://pay', icon: 'phone-portrait', color: '#5F259F' },
    { name: 'Google Pay', scheme: 'gpay://pay', icon: 'logo-google', color: '#4285F4' },
    { name: 'Paytm', scheme: 'paytmmp://pay', icon: 'wallet', color: '#00BAF2' },
    { name: 'BHIM', scheme: 'bhim://pay', icon: 'card', color: '#097ABA' },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>UPI Payment</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color={theme.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Timer */}
            <View style={styles.timerContainer}>
              <Ionicons name="time-outline" size={20} color="#F59E0B" />
              <Text style={[styles.timerText, { color: theme.text }]}>
                Session expires in: {formatTime(countdown)}
              </Text>
            </View>

            {/* Amount Display */}
            <View style={[styles.amountContainer, { backgroundColor: theme.surface }]}>
              <Text style={[styles.amountLabel, { color: theme.textSecondary }]}>Amount to Pay</Text>
              <Text style={[styles.amountValue, { color: theme.primary }]}>₹{amount.toFixed(2)}</Text>
              <Text style={[styles.description, { color: theme.textSecondary }]}>{description}</Text>
              <Text style={[styles.recipient, { color: theme.text }]}>
                To: {recipientName} ({recipientUpiId})
              </Text>
            </View>

            {/* QR Code */}
            {isGenerating ? (
              <View style={styles.qrLoadingContainer}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
                  Generating QR Code...
                </Text>
              </View>
            ) : qrData ? (
              <View style={styles.qrContainer}>
                <View style={styles.qrWrapper}>
                  <QRCode
                    value={qrData}
                    size={200}
                    backgroundColor="white"
                    color="black"
                  />
                </View>
                <Text style={[styles.qrInstruction, { color: theme.textSecondary }]}>
                  Scan with any UPI app to pay
                </Text>
              </View>
            ) : null}

            {/* Or divider */}
            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: theme.surfaceSecondary }]} />
              <Text style={[styles.dividerText, { color: theme.textSecondary }]}>OR PAY WITH</Text>
              <View style={[styles.dividerLine, { backgroundColor: theme.surfaceSecondary }]} />
            </View>

            {/* UPI Apps */}
            <View style={styles.appsContainer}>
              {upiApps.map((app) => (
                <TouchableOpacity
                  key={app.name}
                  style={[styles.appButton, { backgroundColor: theme.surface }]}
                  onPress={() => openUpiApp(app.scheme, app.name)}
                >
                  <View style={[styles.appIcon, { backgroundColor: app.color }]}>
                    <Ionicons name={app.icon as any} size={24} color="white" />
                  </View>
                  <Text style={[styles.appName, { color: theme.text }]}>{app.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Transaction ID */}
            <View style={[styles.transactionInfo, { backgroundColor: theme.surface }]}>
              <Text style={[styles.transactionLabel, { color: theme.textSecondary }]}>
                Transaction ID:
              </Text>
              <Text style={[styles.transactionId, { color: theme.text }]}>{transactionId}</Text>
            </View>

            {/* Instructions */}
            <View style={[styles.instructions, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="information-circle" size={20} color="#F59E0B" />
              <View style={styles.instructionText}>
                <Text style={styles.instructionTitle}>Payment Instructions:</Text>
                <Text style={styles.instructionItem}>1. Scan QR or select your UPI app</Text>
                <Text style={styles.instructionItem}>2. Verify amount and recipient</Text>
                <Text style={styles.instructionItem}>3. Enter your UPI PIN</Text>
                <Text style={styles.instructionItem}>4. Complete the payment</Text>
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.cancelButton, { borderColor: theme.error }]}
              onPress={onClose}
            >
              <Text style={[styles.cancelButtonText, { color: theme.error }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.paidButton, { backgroundColor: '#10B981' }]}
              onPress={() => {
                Alert.alert(
                  'Confirm Payment',
                  'Have you completed the payment?',
                  [
                    { text: 'No', style: 'cancel' },
                    {
                      text: 'Yes, I Paid',
                      onPress: () => {
                        onPaymentSuccess();
                        onClose();
                        Alert.alert('Success', 'Payment marked as completed!');
                      },
                    },
                  ]
                );
              }}
            >
              <Ionicons name="checkmark-circle" size={20} color="white" />
              <Text style={styles.paidButtonText}>I Have Paid</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    marginBottom: 16,
  },
  timerText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  amountContainer: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  amountLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  amountValue: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    marginBottom: 4,
    textAlign: 'center',
  },
  recipient: {
    fontSize: 14,
    marginTop: 4,
  },
  qrLoadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  qrWrapper: {
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  qrInstruction: {
    fontSize: 14,
    marginTop: 12,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 12,
    fontWeight: '600',
    marginHorizontal: 16,
  },
  appsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  appButton: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  appIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  appName: {
    fontSize: 14,
    fontWeight: '600',
  },
  transactionInfo: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  transactionLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  transactionId: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  instructions: {
    padding: 16,
    borderRadius: 10,
    flexDirection: 'row',
    marginBottom: 20,
  },
  instructionText: {
    flex: 1,
    marginLeft: 12,
  },
  instructionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 8,
  },
  instructionItem: {
    fontSize: 13,
    color: '#78350F',
    marginBottom: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  paidButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paidButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: 'white',
    marginLeft: 8,
  },
});

export default UpiPaymentModal;
