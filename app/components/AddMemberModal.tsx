import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useFinanceStore } from '@/lib/store/financeStore';
import { X } from 'lucide-react-native';

interface AddMemberModalProps {
  visible: boolean;
  onClose: () => void;
  groupId: string;
}

export default function AddMemberModal({ visible, onClose, groupId }: AddMemberModalProps) {
  const [email, setEmail] = useState('');
  const { addMemberToGroup, isLoading } = useFinanceStore();

  const handleAddMember = async () => {
    if (!email.trim() || !groupId) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    try {
      await addMemberToGroup(groupId, email.trim());
      setEmail('');
      onClose();
      Alert.alert('Success', 'Member added successfully');
    } catch (error: any) {
      console.error('Add member error:', error);
      Alert.alert('Error', error.message || 'Failed to add member. Please try again.');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Member</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Enter email address"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect={false}
          />

          <TouchableOpacity
            style={[styles.addButton, (!email.trim() || isLoading) && styles.addButtonDisabled]}
            onPress={handleAddMember}
            disabled={!email.trim() || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.addButtonText}>Add Member</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  closeButton: {
    padding: 4,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 20,
  },
  addButton: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  addButtonDisabled: {
    backgroundColor: '#93C5FD',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
