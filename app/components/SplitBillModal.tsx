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
  onSplitBillCreated?: (splitBill: any) => void;
}

export default function SplitBillModal({
  visible,
  onClose,
  groupId,
  groupMembers: propGroupMembers,
  onSplitBillCreated,
}: SplitBillModalProps) {
  const { groupMembers: contextGroupMembers } = useGroupContext();
  const groupMembers = propGroupMembers || contextGroupMembers;
  const { createSplitBill, currentUser } = useFinanceStore();
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Food');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      // For direct chats, automatically select the other user
      if (groupId === null && groupMembers.length === 1) {
        setSelectedMembers(new Set([groupMembers[0].userId]));
      } else {
        setSelectedMembers(new Set());
      }
      setAmount('');
      setDescription('');
      setCategory('Food');
    }
  }, [visible, groupId, groupMembers]);

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
    if (!amount || !description) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    // For direct chats, ensure the other user is selected
    if (groupId === null && selectedMembers.size === 0 && groupMembers.length === 1) {
      Alert.alert('Error', 'Please select the person to split with');
      return;
    }

    // For group chats, ensure at least one member is selected
    if (groupId !== null && selectedMembers.size === 0) {
      Alert.alert('Error', 'Please select at least one member to split with');
      return;
    }

    // Allow null groupId for direct chats
    if (groupId !== null && (!groupId || groupId.trim() === '' || groupId === 'undefined')) {
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

    // For direct chats, we don't need to validate group members
    if (groupId !== null) {
      // Validate selected members exist in group members
      const invalidMembers = Array.from(selectedMembers).filter(
        memberId => !groupMembers.some(m => m.userId === memberId)
      );
      if (invalidMembers.length > 0) {
        Alert.alert('Error', 'Some selected members are not valid group members');
        return;
      }
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
      let splitAmount: number;
      let allParticipants: { userId: string; amount: number }[];
      
      if (groupId === null && groupMembers.length === 1) {
        // Direct chat: split between current user and the other user
        splitAmount = numAmount / 2;
        allParticipants = [
          {
            userId: groupMembers[0].userId,
            amount: splitAmount,
          },
          {
            userId: currentUser._id,
            amount: splitAmount,
          }
        ];
      } else {
        // Group chat: split between selected members + current user
        splitAmount = numAmount / (selectedMembers.size + 1);
        allParticipants = [
          ...Array.from(selectedMembers).map(userId => ({
            userId,
            amount: splitAmount,
          })),
          {
            userId: currentUser._id,
            amount: splitAmount,
          }
        ];
      }

      const splitBillData: any = {
        description,
        totalAmount: numAmount,
        participants: allParticipants,
        splitType: 'equal' as const,
        category,
        currency: 'INR',
      };

      // Only add groupId for group chats
      if (groupId !== null && groupId !== undefined) {
        splitBillData.groupId = groupId;
      }

      console.log('SplitBillModal - Sending split bill data:', JSON.stringify(splitBillData, null, 2));
      console.log('SplitBillModal - GroupId in data:', splitBillData.groupId, 'type:', typeof splitBillData.groupId);
      console.log('SplitBillModal - Participants details:', splitBillData.participants.map((p: any) => ({ userId: p.userId, amount: p.amount, userIdType: typeof p.userId })));

      const createdBill = await createSplitBill(splitBillData);
      onClose();
      Alert.alert('Success', 'Split bill created successfully!');
      
      // Call the callback if provided
      if (onSplitBillCreated) {
        onSplitBillCreated(createdBill);
      }
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

  const splitAmount = (() => {
    if (!amount) return '0.00';
    
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return '0.00';
    
    // For direct chats, always split between 2 people (current user + other user)
    if (groupId === null && groupMembers.length === 1) {
      return (numAmount / 2).toFixed(2);
    }
    
    // For group chats, split based on selected members + current user
    if (selectedMembers.size === 0) return '0.00';
    
    return (numAmount / (selectedMembers.size + 1)).toFixed(2);
  })();

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

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryContainer}>
              {['Food', 'Transport', 'Entertainment', 'Shopping', 'Bills', 'Other'].map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryChip,
                    category === cat && styles.categoryChipSelected,
                  ]}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={[
                    styles.categoryChipText,
                    category === cat && styles.categoryChipTextSelected,
                  ]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.membersSection}>
            <Text style={styles.label}>
              {groupId === null ? 'Split with' : `Split with (${selectedMembers.size} selected)`}
            </Text>
            <Text style={styles.splitAmount}>
              {groupId === null && groupMembers.length === 1
                ? `Each pays: ₹${splitAmount}`
                : selectedMembers.size > 0
                  ? `Each pays: ₹${splitAmount}`
                  : 'Select members to see split amount'
              }
            </Text>

            {groupMembers.map((member: any) => {
              // For direct chats, the single member should be pre-selected
              const isSelected = groupId === null && groupMembers.length === 1
                ? true
                : selectedMembers.has(member.userId);
              
              return (
                <TouchableOpacity
                  key={member.userId}
                  style={[
                    styles.memberItem,
                    isSelected && styles.memberItemSelected,
                  ]}
                  onPress={() => {
                    // For direct chats with single member, don't allow deselection
                    if (groupId === null && groupMembers.length === 1) {
                      return;
                    }
                    toggleMember(member.userId);
                  }}
                  disabled={groupId === null && groupMembers.length === 1}
                >
                  <View style={styles.memberInfo}>
                    <View style={styles.memberAvatar}>
                      <Text style={styles.memberInitial}>
                        {member.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.memberName}>{member.name}</Text>
                  </View>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={24} color={theme.primary || '#2563EB'} />
                  )}
                </TouchableOpacity>
              );
            })}
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
  categoryContainer: {
    flexDirection: 'row',
    marginTop: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.border || '#E5E7EB',
    backgroundColor: theme.surface || '#FFFFFF',
    marginRight: 8,
  },
  categoryChipSelected: {
    borderColor: theme.primary || '#2563EB',
    backgroundColor: theme.primary || '#2563EB',
  },
  categoryChipText: {
    fontSize: 14,
    color: theme.text || '#1F2937',
  },
  categoryChipTextSelected: {
    color: theme.surface || '#FFFFFF',
  },
});