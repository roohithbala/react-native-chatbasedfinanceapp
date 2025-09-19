import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFinanceStore } from '@/lib/store/financeStore';
import { View as ThemedView, Card } from '@/app/components/ThemedComponents';
import { useGroupContext } from '@/app/context/GroupContext';

interface GroupMember {
  userId: string;
  name: string;
  avatar?: string;
  role: 'admin' | 'member';
}

interface ParticipantInput {
  userId: string;
  name: string;
  amount: string;
}

export default function CreateSplitBillModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const [description, setDescription] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [category, setCategory] = useState('Other');
  const [splitType, setSplitType] = useState<'equal' | 'custom'>('equal');
  const [participants, setParticipants] = useState<ParticipantInput[]>([]);
  const [loading, setLoading] = useState(false);

  const { currentUser, selectedGroup, createSplitBill } = useFinanceStore();
  const { groupMembers } = useGroupContext();

  // Initialize participants with current user
  React.useEffect(() => {
    if (currentUser && groupMembers && Array.isArray(groupMembers)) {
      setParticipants(
        groupMembers
          .filter((member: GroupMember) => member && member.userId && member.userId !== currentUser?._id)
          .map((member: GroupMember) => ({
            userId: member.userId,
            name: member.name || 'Unknown User',
            amount: '',
          }))
      );
    } else {
      setParticipants([]);
    }
  }, [currentUser, groupMembers]);

  const handleSplitTypeChange = (type: 'equal' | 'custom') => {
    setSplitType(type);
    if (type === 'equal' && totalAmount) {
      const amount = parseFloat(totalAmount);
      const equalShare = ((amount || 0) / (participants.length + 1)).toFixed(2);
      setParticipants(
        participants.map(p => ({
          ...p,
          amount: equalShare,
        }))
      );
    }
  };

  const handleTotalAmountChange = (value: string) => {
    setTotalAmount(value);
    if (splitType === 'equal' && value) {
      const amount = parseFloat(value);
      const equalShare = ((amount || 0) / (participants.length + 1)).toFixed(2);
      setParticipants(
        participants.map(p => ({
          ...p,
          amount: equalShare,
        }))
      );
    }
  };

  const handleParticipantAmountChange = (value: string, index: number) => {
    const updatedParticipants = [...participants];
    updatedParticipants[index] = {
      ...updatedParticipants[index],
      amount: value,
    };
    setParticipants(updatedParticipants);
  };

  const validateInputs = () => {
    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return false;
    }

    if (!totalAmount || parseFloat(totalAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid total amount');
      return false;
    }

    if (splitType === 'custom') {
      const sum = participants.reduce(
        (acc, p) => acc + (parseFloat(p.amount) || 0),
        0
      );
      if (Math.abs(sum - parseFloat(totalAmount)) > 0.01) {
        Alert.alert(
          'Error',
          'Sum of participant amounts must equal total amount'
        );
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateInputs()) return;
    if (!selectedGroup) {
      Alert.alert('Error', 'No group selected');
      return;
    }

    try {
      setLoading(true);
      const billData = {
        description: description.trim(),
        totalAmount: parseFloat(totalAmount),
        groupId: selectedGroup._id,
        participants: participants.map(p => ({
          userId: p.userId,
          amount: parseFloat(p.amount),
        })),
        splitType,
        category,
      };

      await createSplitBill(billData);
      Alert.alert('Success', 'Split bill created successfully');
      onClose();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create split bill');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <ThemedView style={styles.modalContainer}>
        <Card style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#64748B" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Create Split Bill</Text>
            <TouchableOpacity onPress={handleSubmit} disabled={loading}>
              <Text style={[styles.saveButton, loading && styles.saveButtonDisabled]}>
                Save
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={styles.input}
                value={description}
                onChangeText={setDescription}
                placeholder="Enter bill description"
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Total Amount</Text>
              <TextInput
                style={styles.input}
                value={totalAmount}
                onChangeText={handleTotalAmountChange}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Category</Text>
              <View style={styles.categories}>
                {['Food', 'Transport', 'Entertainment', 'Shopping', 'Other'].map(cat => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryChip,
                      category === cat && styles.categoryChipActive,
                    ]}
                    onPress={() => setCategory(cat)}
                  >
                    <Text
                      style={[
                        styles.categoryText,
                        category === cat && styles.categoryTextActive,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Split Type</Text>
              <View style={styles.splitTypes}>
                <TouchableOpacity
                  style={[
                    styles.splitTypeButton,
                    splitType === 'equal' && styles.splitTypeActive,
                  ]}
                  onPress={() => handleSplitTypeChange('equal')}
                >
                  <Text
                    style={[
                      styles.splitTypeText,
                      splitType === 'equal' && styles.splitTypeTextActive,
                    ]}
                  >
                    Equal Split
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.splitTypeButton,
                    splitType === 'custom' && styles.splitTypeActive,
                  ]}
                  onPress={() => handleSplitTypeChange('custom')}
                >
                  <Text
                    style={[
                      styles.splitTypeText,
                      splitType === 'custom' && styles.splitTypeTextActive,
                    ]}
                  >
                    Custom Split
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Participants</Text>
              {participants && participants.length > 0 ? (
                participants.map((participant, index) => (
                  <View key={participant?.userId || index} style={styles.participantRow}>
                    <Text style={styles.participantName}>{participant?.name || 'Unknown User'}</Text>
                    <TextInput
                      style={styles.participantAmount}
                      value={participant?.amount || ''}
                      onChangeText={(value) => handleParticipantAmountChange(value, index)}
                      keyboardType="decimal-pad"
                      placeholder="0.00"
                      placeholderTextColor="#94A3B8"
                      editable={splitType === 'custom'}
                    />
                  </View>
                ))
              ) : (
                <Text style={styles.noParticipantsText}>No participants available</Text>
              )}
            </View>
          </ScrollView>
        </Card>
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  saveButton: {
    fontSize: 16,
    color: '#2563EB',
    fontWeight: '600',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    fontSize: 16,
    color: '#1E293B',
  },
  categories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
  },
  categoryChipActive: {
    backgroundColor: '#2563EB',
  },
  categoryText: {
    color: '#64748B',
    fontWeight: '500',
  },
  categoryTextActive: {
    color: '#fff',
  },
  splitTypes: {
    flexDirection: 'row',
    gap: 12,
  },
  splitTypeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  splitTypeActive: {
    backgroundColor: '#2563EB',
  },
  splitTypeText: {
    fontWeight: '600',
    color: '#64748B',
  },
  splitTypeTextActive: {
    color: '#fff',
  },
  participantRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  participantName: {
    fontSize: 16,
    color: '#1E293B',
    flex: 1,
  },
  participantAmount: {
    width: 100,
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    textAlign: 'right',
  },
  noParticipantsText: {
    fontSize: 14,
    color: '#64748B',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 16,
  },
});
