import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGroupContext } from '../context/GroupContext';
import { useFinanceStore } from '@/lib/store/financeStore';
import { useTheme } from '../context/ThemeContext';

interface SplitBillModalProps {
  visible: boolean;
  onClose: () => void;
  groupId: string | null;
  groupMembers?: {
    userId: string;
    name: string;
    username?: string;
  }[];
}

export default function SplitBillModal({
  visible,
  onClose,
  groupId,
  groupMembers: propGroupMembers,
}: SplitBillModalProps) {
  const { groupMembers: contextGroupMembers } = useGroupContext();
  const groupMembers = propGroupMembers || contextGroupMembers;
  const { createSplitBill, currentUser } = useFinanceStore();
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setSelectedMembers(new Set());
      setAmount('');
      setDescription('');
    }
  }, [visible]);

  const toggleMember = (memberId: string) => {
    const newSelected = new Set(selectedMembers);
    if (newSelected.has(memberId)) {
      newSelected.delete(memberId);
    } else {
      newSelected.add(memberId);
    }
    setSelectedMembers(newSelected);
  };

  const handleCreateSplitBill = async () => {
    if (!amount || !description || selectedMembers.size === 0) {
      Alert.alert('Error', 'Please fill in all fields and select at least one member');
      return;
    }

    if (!groupId || groupId.trim() === '' || groupId === 'undefined' || groupId === 'null') {
      Alert.alert('Error', 'Invalid group. Please try again.');
      return;
    }

    if (!currentUser?._id) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    // Validate selected members exist in group members
    const invalidMembers = Array.from(selectedMembers).filter(
      memberId => !groupMembers.some(m => m.userId === memberId)
    );
    if (invalidMembers.length > 0) {
      Alert.alert('Error', 'Some selected members are not valid group members');
      return;
    }

    // Debug logging
    console.log('SplitBillModal - Creating split bill with:', {
      groupId,
      currentUserId: currentUser._id,
      currentUserName: currentUser.name,
      selectedMembersCount: selectedMembers.size,
      selectedMembers: Array.from(selectedMembers),
      groupMembersCount: groupMembers.length,
      groupMembers: groupMembers.map(m => ({ id: m.userId, name: m.name }))
    });

    setIsLoading(true);
    try {
      const numAmount = parseFloat(amount);
      const splitAmount = numAmount / (selectedMembers.size + 1); // +1 for current user
      
      // Include current user as a participant who has paid their share
      const allParticipants = [
        ...Array.from(selectedMembers).map(userId => ({
          userId,
          amount: splitAmount,
        })),
        {
          userId: currentUser._id,
          amount: splitAmount,
        }
      ];

      const splitBillData = {
        description,
        totalAmount: numAmount,
        groupId,
        participants: allParticipants,
        splitType: 'equal' as const,
        category: 'Other',
        currency: 'INR',
      };

      console.log('SplitBillModal - Sending split bill data:', JSON.stringify(splitBillData, null, 2));

      await createSplitBill(splitBillData);
      onClose();
      Alert.alert('Success', 'Split bill created successfully!');
    } catch (error: any) {
      console.error('SplitBillModal - Error creating split bill:', error);
      console.error('SplitBillModal - Error response:', error.response?.data);
      console.error('SplitBillModal - Error status:', error.response?.status);
      const errorMessage = error.message || 'Failed to create split bill. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const splitAmount = amount && selectedMembers.size > 0
    ? (parseFloat(amount) / (selectedMembers.size + 1)).toFixed(2)
    : '0.00';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={theme.textSecondary || '#6B7280'} />
          </TouchableOpacity>
          <Text style={styles.title}>Create Split Bill</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="document-text" size={20} color={theme.textSecondary || '#9CA3AF'} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={description}
                onChangeText={setDescription}
                placeholder="What is this bill for?"
                placeholderTextColor={theme.textSecondary || '#9CA3AF'}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Total Amount</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="cash" size={20} color={theme.textSecondary || '#9CA3AF'} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                placeholderTextColor={theme.textSecondary || '#9CA3AF'}
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          <View style={styles.membersSection}>
            <Text style={styles.label}>Split with ({selectedMembers.size} selected)</Text>
            <Text style={styles.splitAmount}>Each pays: ${splitAmount}</Text>

            {groupMembers.map((member: any) => (
              <TouchableOpacity
                key={member.userId}
                style={[
                  styles.memberItem,
                  selectedMembers.has(member.userId) && styles.memberItemSelected,
                ]}
                onPress={() => toggleMember(member.userId)}
              >
                <View style={styles.memberInfo}>
                  <View style={styles.memberAvatar}>
                    <Text style={styles.memberInitial}>
                      {member.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.memberName}>{member.name}</Text>
                </View>
                {selectedMembers.has(member.userId) && (
                  <Ionicons name="checkmark-circle" size={24} color={theme.primary || '#2563EB'} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.createButton, isLoading && styles.createButtonDisabled]}
            onPress={handleCreateSplitBill}
            disabled={isLoading}
          >
            <Text style={styles.createButtonText}>
              {isLoading ? 'Creating...' : 'Create Split Bill'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.surface || '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border || '#E5E7EB',
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text || '#1F2937',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.text || '#374151',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border || '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: theme.surfaceSecondary || '#F9FAFB',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: theme.text || '#1F2937',
  },
  membersSection: {
    marginBottom: 24,
  },
  splitAmount: {
    fontSize: 14,
    color: theme.textSecondary || '#6B7280',
    marginBottom: 16,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderWidth: 1,
    borderColor: theme.border || '#E5E7EB',
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: theme.surface || '#FFFFFF',
  },
  memberItemSelected: {
    borderColor: theme.primary || '#2563EB',
    backgroundColor: theme.surfaceSecondary || '#EFF6FF',
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.surfaceSecondary || '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberInitial: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textSecondary || '#6B7280',
  },
  memberName: {
    fontSize: 16,
    color: theme.text || '#1F2937',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: theme.border || '#E5E7EB',
  },
  createButton: {
    backgroundColor: theme.primary || '#2563EB',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  createButtonDisabled: {
    backgroundColor: theme.textSecondary || '#9CA3AF',
  },
  createButtonText: {
    color: theme.surface || '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});