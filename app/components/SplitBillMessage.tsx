import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SplitBillData } from '../types/chat';
import { useTheme } from '../context/ThemeContext';

interface SplitBillMessageProps {
  splitBillData: SplitBillData;
  currentUserId: string;
  onPayBill?: (splitBillId: string) => void;
  onViewDetails?: (splitBillId: string) => void;
}

export default function SplitBillMessage({
  splitBillData,
  currentUserId,
  onPayBill,
  onViewDetails
}: SplitBillMessageProps) {
  const { theme } = useTheme();
  const userParticipant = splitBillData.participants.find(p => p.userId === currentUserId);
  const isPaid = userParticipant?.isPaid || false;
  const userShare = userParticipant?.amount || 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="people" size={20} color="#8B5CF6" />
        <Text style={styles.title}>Split Bill</Text>
      </View>

      <Text style={styles.description}>{splitBillData.description}</Text>

      <View style={styles.amountContainer}>
        <Text style={styles.totalAmount}>
          Total: {theme.currency}{splitBillData.totalAmount.toFixed(2)}
        </Text>
        <Text style={styles.userShare}>
          Your share: {theme.currency}{userShare.toFixed(2)}
        </Text>
      </View>

      <View style={styles.participantsContainer}>
        <Text style={styles.participantsTitle}>
          {splitBillData.participants.length} participants
        </Text>
        {splitBillData.participants.slice(0, 3).map((participant, index) => (
          <Text key={participant.userId} style={styles.participantName}>
            {participant.name}
            {participant.isPaid && <Text style={styles.paidIndicator}> ✓</Text>}
          </Text>
        ))}
        {splitBillData.participants.length > 3 && (
          <Text style={styles.moreParticipants}>
            +{splitBillData.participants.length - 3} more
          </Text>
        )}
      </View>

      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.viewDetailsButton]}
          onPress={() => onViewDetails?.(splitBillData.splitBillId)}
        >
          <Text style={styles.viewDetailsText}>View Details</Text>
        </TouchableOpacity>

        {!isPaid && onPayBill && (
          <TouchableOpacity
            style={[styles.actionButton, styles.payButton]}
            onPress={() => onPayBill(splitBillData.splitBillId)}
          >
            <Text style={styles.payButtonText}>Pay {theme.currency}{userShare.toFixed(2)}</Text>
          </TouchableOpacity>
        )}

        {isPaid && (
          <View style={styles.paidBadge}>
            <Ionicons name="checkmark-circle" size={16} color="#10B981" />
            <Text style={styles.paidBadgeText}>Paid</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#8B5CF6',
    marginVertical: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8B5CF6',
    marginLeft: 8,
  },
  description: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 12,
    lineHeight: 20,
  },
  amountContainer: {
    marginBottom: 12,
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  userShare: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '600',
  },
  participantsContainer: {
    marginBottom: 12,
  },
  participantsTitle: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  participantName: {
    fontSize: 12,
    color: '#374151',
    marginBottom: 2,
  },
  paidIndicator: {
    color: '#10B981',
    fontWeight: 'bold',
  },
  moreParticipants: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  viewDetailsButton: {
    backgroundColor: '#E5E7EB',
  },
  viewDetailsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  payButton: {
    backgroundColor: '#8B5CF6',
  },
  payButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  paidBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#065F46',
    marginLeft: 4,
  },
});