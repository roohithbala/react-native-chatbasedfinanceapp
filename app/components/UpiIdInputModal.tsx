import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface UpiIdInputModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (upiId: string) => void;
  amount: number;
  description: string;
}

const UpiIdInputModal: React.FC<UpiIdInputModalProps> = ({
  visible,
  onClose,
  onSubmit,
  amount,
  description,
}) => {
  const [upiId, setUpiId] = useState('');
  const [error, setError] = useState('');

  const validateUpiId = (id: string): boolean => {
    const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/;
    return upiRegex.test(id);
  };

  const handleSubmit = () => {
    const trimmedUpiId = upiId.trim();

    if (!trimmedUpiId) {
      setError('Please enter a UPI ID');
      return;
    }

    if (!validateUpiId(trimmedUpiId)) {
      setError('Invalid UPI ID format. Use format like merchant@ybl');
      return;
    }

    setError('');
    onSubmit(trimmedUpiId);
    setUpiId('');
    onClose();
  };

  const handleClose = () => {
    setUpiId('');
    setError('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Enter UPI ID</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <Text style={styles.instruction}>
              Enter the recipient&apos;s UPI ID to proceed with payment
            </Text>

            <TextInput
              style={[styles.input, error ? styles.inputError : null]}
              value={upiId}
              onChangeText={(text) => {
                setUpiId(text);
                if (error) setError('');
              }}
              placeholder="e.g., merchant@ybl, user@paytm"
              placeholderTextColor="#999"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.amountContainer}>
              <Text style={styles.amountLabel}>Amount:</Text>
              <Text style={styles.amountValue}>₹{amount.toFixed(2)}</Text>
            </View>

            <Text style={styles.descriptionText}>{description}</Text>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.payButton, !upiId.trim() && styles.payButtonDisabled]}
              onPress={handleSubmit}
              disabled={!upiId.trim()}
            >
              <Text style={styles.payButtonText}>Pay ₹{amount.toFixed(2)}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  instruction: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 8,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginBottom: 16,
  },
  amountContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  amountLabel: {
    fontSize: 16,
    color: '#666',
    marginRight: 8,
  },
  amountValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  descriptionText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
  },
  payButton: {
    flex: 2,
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  payButtonDisabled: {
    backgroundColor: '#CCC',
  },
  payButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default UpiIdInputModal;