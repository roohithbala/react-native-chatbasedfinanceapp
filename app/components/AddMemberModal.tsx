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
  const [identifier, setIdentifier] = useState('');
  const [searchType, setSearchType] = useState<'email' | 'username'>('username');
  const { addMemberToGroup, isLoading } = useFinanceStore();

  const handleAddMember = async () => {
    if (!identifier.trim() || !groupId) {
      Alert.alert('Error', `Please enter a valid ${searchType}`);
      return;
    }

    try {
      await addMemberToGroup(groupId, identifier.trim(), searchType);
      setIdentifier('');
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

          <Text style={styles.label}>Add Member</Text>
          
          {/* Search Type Toggle */}
          <View style={styles.searchTypeContainer}>
            <TouchableOpacity
              style={[styles.searchTypeButton, searchType === 'username' && styles.searchTypeButtonActive]}
              onPress={() => setSearchType('username')}
            >
              <Text style={[styles.searchTypeText, searchType === 'username' && styles.searchTypeTextActive]}>
                Username
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.searchTypeButton, searchType === 'email' && styles.searchTypeButtonActive]}
              onPress={() => setSearchType('email')}
            >
              <Text style={[styles.searchTypeText, searchType === 'email' && styles.searchTypeTextActive]}>
                Email
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>{searchType === 'username' ? 'Username' : 'Email Address'}</Text>
          <TextInput
            style={styles.input}
            value={identifier}
            onChangeText={setIdentifier}
            placeholder={searchType === 'username' ? "Enter username" : "Enter email address"}
            keyboardType={searchType === 'email' ? 'email-address' : 'default'}
            autoCapitalize={searchType === 'username' ? 'none' : 'none'}
            autoComplete={searchType === 'email' ? 'email' : 'username'}
            autoCorrect={false}
          />

          <TouchableOpacity
            style={[styles.addButton, (!identifier.trim() || isLoading) && styles.addButtonDisabled]}
            onPress={handleAddMember}
            disabled={!identifier.trim() || isLoading}
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
  searchTypeContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 2,
    marginBottom: 16,
  },
  searchTypeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  searchTypeButtonActive: {
    backgroundColor: '#2563EB',
  },
  searchTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  searchTypeTextActive: {
    color: 'white',
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
